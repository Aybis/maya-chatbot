"""Chat: REST conversation lifecycle + WebSocket streaming + org-ownership guard.

These cover the bugs that produced "Error: Conversation not found":
  1. POST/GET /chat/conversations/ must resolve WITHOUT a 307 redirect.
  2. The WS must resolve the same org as the REST create path (fallback chain).
"""
import json
import pytest


# ── REST conversation lifecycle ──

@pytest.mark.asyncio
async def test_create_conversation_no_redirect(client, owner):
    """POST /chat/conversations/ must return 200 directly (not 307->405)."""
    r = await client.post("/api/v1/chat/conversations/",
                          headers=owner["headers"],
                          json={"title": "T", "model": "gpt-5.5"},
                          follow_redirects=False)
    assert r.status_code == 200, f"expected 200, got {r.status_code} (redirect={r.headers.get('location')})"
    assert r.json()["id"]


@pytest.mark.asyncio
async def test_conversation_crud(client, owner):
    h = owner["headers"]
    cid = (await client.post("/api/v1/chat/conversations/", headers=h,
                             json={"title": "Chat", "model": "m"})).json()["id"]

    lst = await client.get("/api/v1/chat/conversations/", headers=h)
    assert any(c["id"] == cid for c in lst.json())

    msgs = await client.get(f"/api/v1/chat/conversations/{cid}/messages", headers=h)
    assert msgs.status_code == 200 and msgs.json() == []

    d = await client.delete(f"/api/v1/chat/conversations/{cid}", headers=h)
    assert d.status_code == 200


@pytest.mark.asyncio
async def test_conversation_org_isolation(client, owner):
    """A conversation from org A must not be visible/deletable from org B."""
    import uuid
    from tests.conftest import _register, _auth
    cid = (await client.post("/api/v1/chat/conversations/", headers=owner["headers"],
                             json={"title": "Private", "model": "m"})).json()["id"]

    u = uuid.uuid4().hex[:8]
    other = await _register(client, f"ci_{u}@t.com", f"ci_{u}")
    oh = _auth(other["access_token"], other["organizations"][0]["id"])

    lst = await client.get("/api/v1/chat/conversations/", headers=oh)
    assert all(c["id"] != cid for c in lst.json())

    msgs = await client.get(f"/api/v1/chat/conversations/{cid}/messages", headers=oh)
    assert msgs.status_code == 404


# ── WebSocket chat ──
# These use the sync Starlette TestClient (ws_client) for in-process WS, while
# the conversation is created via the async REST client. Both share the same
# app + test DB, so state is consistent.


async def _seed_provider(org_id):
    """Insert a provider row so resolve_provider succeeds (the LLM call itself
    is mocked, so no real upstream is contacted)."""
    import secrets
    from app.db.database import get_db
    async for db in get_db():
        await db.execute(
            "INSERT INTO providers (id, organization_id, name, base_url, api_key, is_default) VALUES (?,?,?,?,?,1)",
            (secrets.token_hex(16), org_id, "mockprov", "http://upstream.test/v1", "sk-x"),
        )
        await db.commit()


@pytest.mark.asyncio
async def test_ws_requires_auth(ws_client):
    # Server sends an error frame then closes with 4401.
    with ws_client.websocket_connect("/ws/chat") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "error"


@pytest.mark.asyncio
async def test_ws_unknown_conversation_errors(ws_client, owner):
    """Sending a message for a nonexistent conversation -> 'Conversation not found'."""
    with ws_client.websocket_connect(f"/ws/chat?token={owner['access_token']}") as ws:
        ws.send_json({
            "conversation_id": "does-not-exist",
            "message": "hi", "model": "", "attachments": [],
        })
        msg = ws.receive_json()
        assert msg["type"] == "error"
        assert "Conversation not found" in msg["content"]


@pytest.mark.asyncio
async def test_ws_full_chat_roundtrip(client, ws_client, owner, monkeypatch):
    """REST creates the conversation; WS streams a mocked reply and persists it.

    This is the exact path that was failing with 'Conversation not found'.
    """
    h = owner["headers"]
    await _seed_provider(owner["organizations"][0]["id"])
    # 1. REST create (the fixed route)
    cid = (await client.post("/api/v1/chat/conversations/", headers=h,
                             json={"title": "WS", "model": "gpt-5.5"})).json()["id"]

    # 2. Mock the LLM stream so no external provider is needed.
    async def fake_stream(self, provider, model_id, messages, system_prompt,
                          temperature, max_tokens, conversation_id, org_id, user_id):
        yield json.dumps({"type": "token", "content": "Hello"})
        yield json.dumps({"type": "token", "content": " there"})
        yield json.dumps({"type": "done"})
    from app.services.llm import LLMService
    monkeypatch.setattr(LLMService, "_stream_openai_compatible", fake_stream)

    # 3. WS send + receive tokens + done
    tokens = []
    with ws_client.websocket_connect(f"/ws/chat?token={owner['access_token']}") as ws:
        ws.send_json({
            "conversation_id": cid, "message": "hi there",
            "model": "gpt-5.5", "attachments": [],
        })
        while True:
            msg = ws.receive_json()
            if msg["type"] == "token":
                tokens.append(msg["content"])
            elif msg["type"] == "done":
                break
            elif msg["type"] == "error":
                pytest.fail(f"WS error: {msg['content']}")

    assert "".join(tokens) == "Hello there"

    # 4. Both messages persisted
    msgs = (await client.get(f"/api/v1/chat/conversations/{cid}/messages", headers=h)).json()
    roles = [m["role"] for m in msgs]
    assert "user" in roles and "assistant" in roles
    assert any(m["content"] == "Hello there" for m in msgs)


@pytest.mark.asyncio
async def test_ws_token_without_org_claim_falls_back(client, ws_client, owner, monkeypatch):
    """A token whose 'org' claim is null must still resolve the org via DB."""
    from app.services.auth import _encode
    from datetime import timedelta
    await _seed_provider(owner["organizations"][0]["id"])
    # craft an access token with NO org claim
    token = _encode({"sub": owner["user"]["id"], "type": "access", "org": None},
                    timedelta(minutes=15))

    async def fake_stream(self, provider, model_id, messages, system_prompt,
                          temperature, max_tokens, conversation_id, org_id, user_id):
        yield json.dumps({"type": "token", "content": "ok"})
        yield json.dumps({"type": "done"})
    from app.services.llm import LLMService
    monkeypatch.setattr(LLMService, "_stream_openai_compatible", fake_stream)

    cid = (await client.post("/api/v1/chat/conversations/", headers=owner["headers"],
                             json={"title": "x", "model": "m"})).json()["id"]

    got = []
    with ws_client.websocket_connect(f"/ws/chat?token={token}") as ws:
        ws.send_json({
            "conversation_id": cid, "message": "hi", "model": "m", "attachments": [],
        })
        while True:
            msg = ws.receive_json()
            if msg["type"] == "token":
                got.append(msg["content"])
            elif msg["type"] == "done":
                break
            elif msg["type"] == "error":
                pytest.fail(f"WS error (org fallback failed): {msg['content']}")
    assert got == ["ok"]
