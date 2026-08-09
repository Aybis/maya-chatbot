"""B2: API Keys (hash-only, show-once, revoke) + public /v1/chat/completions."""
import json
import pytest

from app.db.database import get_db


@pytest.mark.asyncio
async def test_api_key_create_show_once_and_hash(client, owner):
    h = owner["headers"]
    r = await client.post("/api/v1/api-keys/", headers=h, json={"name": "prod"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["key"].startswith("maya_")
    assert body["prefix"]

    # list must NOT leak plaintext or hash
    lst = await client.get("/api/v1/api-keys/", headers=h)
    for k in lst.json():
        assert "key" not in k and "key_hash" not in k
        assert k["prefix"].startswith("maya_")

    # DB stores only a hash (64 hex chars)
    async for db in get_db():
        cur = await db.execute("SELECT key_hash, prefix FROM api_keys WHERE id = ?", (body["id"],))
        row = await cur.fetchone()
        assert row and len(row["key_hash"]) == 64
        assert row["key_hash"] != body["key"]


@pytest.mark.asyncio
async def test_api_key_revoke_blocks_access(client, owner):
    h = owner["headers"]
    key = (await client.post("/api/v1/api-keys/", headers=h, json={"name": "k"})).json()
    kid, plaintext = key["id"], key["key"]

    # sanity: key resolves before revoke (401->would fail at provider step, not auth)
    # revoke
    rv = await client.delete(f"/api/v1/api-keys/{kid}", headers=h)
    assert rv.status_code == 200

    # revoked key -> 401 on the public endpoint
    r = await client.post("/v1/chat/completions",
                          headers={"Authorization": f"Bearer {plaintext}"},
                          json={"model": "m", "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_chat_completions_auth_gates(client):
    # no auth
    r = await client.post("/v1/chat/completions",
                          json={"model": "m", "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 401
    # bad key
    r = await client.post("/v1/chat/completions",
                          headers={"Authorization": "Bearer maya_nope"},
                          json={"model": "m", "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_chat_completions_no_provider_is_502_not_401(client, owner):
    # A fresh org has no providers — auth passes, provider resolution fails cleanly.
    h = owner["headers"]
    key = (await client.post("/api/v1/api-keys/", headers=h, json={"name": "k"})).json()
    r = await client.post("/v1/chat/completions",
                          headers={"Authorization": f"Bearer {key['key']}"},
                          json={"model": "m", "messages": [{"role": "user", "content": "hi"}]})
    assert r.status_code == 502
    assert "No providers" in r.json()["detail"]


@pytest.mark.asyncio
async def test_chat_completions_end_to_end_mocked(client, owner, monkeypatch):
    """Full path with a mocked upstream provider — no external network."""
    h = owner["headers"]
    # register a provider row directly (skip discovery)
    async for db in get_db():
        import secrets
        pid = secrets.token_hex(16)
        await db.execute(
            "INSERT INTO providers (id, organization_id, name, base_url, api_key, is_default) VALUES (?,?,?,?,?,1)",
            (pid, owner["organizations"][0]["id"], "mockprov", "http://upstream.test/v1", "sk-x"),
        )
        await db.commit()

    # Mock the streaming call to return token chunks then done
    async def fake_stream(self, provider, model_id, messages, system_prompt,
                          temperature, max_tokens, conversation_id, org_id, user_id):
        yield json.dumps({"type": "token", "content": "PO"})
        yield json.dumps({"type": "token", "content": "NG"})
        yield json.dumps({"type": "done"})

    from app.services.llm import LLMService
    monkeypatch.setattr(LLMService, "_stream_openai_compatible", fake_stream)

    key = (await client.post("/api/v1/api-keys/", headers=h, json={"name": "e2e"})).json()
    r = await client.post("/v1/chat/completions",
                          headers={"Authorization": f"Bearer {key['key']}"},
                          json={"model": "mockprov/some-model",
                                "messages": [{"role": "user", "content": "ping"}]})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["object"] == "chat.completion"
    assert body["choices"][0]["message"]["content"] == "PONG"
