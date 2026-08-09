"""B6: Admin console summary + B4: MCP server registry."""
import pytest

from tests.conftest import _register, _auth


# ── B6 Admin ──

@pytest.mark.asyncio
async def test_admin_summary_owner(client, owner):
    h = owner["headers"]
    await client.post("/api/v1/api-keys/", headers=h, json={"name": "k"})
    await client.post("/api/v1/prompts/", headers=h, json={"name": "p", "content": "c"})

    r = await client.get("/api/v1/admin/summary", headers=h)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["organization"]["id"] == owner["organizations"][0]["id"]
    assert body["counts"]["api_keys"] >= 1
    assert body["counts"]["prompts"] >= 1
    assert "total_cost" in body["usage"]


@pytest.mark.asyncio
async def test_admin_summary_member_forbidden(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    org_id = owner["organizations"][0]["id"]
    member = await _register(client, f"adm_{u}@t.com", f"adm_{u}")
    inv = await client.post(f"/api/v1/auth/organizations/{org_id}/invitations",
                            headers=owner["headers"],
                            json={"email": member["user"]["email"], "role": "member"})
    await client.post("/api/v1/auth/invitations/accept",
                      headers=_auth(member["access_token"]),
                      json={"token": inv.json()["token"]})
    r = await client.get("/api/v1/admin/summary", headers=_auth(member["access_token"], org_id))
    assert r.status_code == 403


# ── B4 MCP ──

@pytest.mark.asyncio
async def test_mcp_crud_toggle(client, owner):
    h = owner["headers"]
    r = await client.post("/api/v1/mcp/", headers=h,
                          json={"name": "fs", "url": "http://localhost:9999"})
    assert r.status_code == 200, r.text
    sid = r.json()["id"]
    assert r.json()["enabled"] is True

    lst = await client.get("/api/v1/mcp/", headers=h)
    assert any(s["id"] == sid for s in lst.json())

    # toggle off
    t = await client.post(f"/api/v1/mcp/{sid}/toggle", headers=h)
    assert t.json()["enabled"] is False

    # delete
    d = await client.delete(f"/api/v1/mcp/{sid}", headers=h)
    assert d.status_code == 200


@pytest.mark.asyncio
async def test_mcp_tools_graceful_on_unreachable(client, owner):
    h = owner["headers"]
    sid = (await client.post("/api/v1/mcp/", headers=h,
                             json={"name": "down", "url": "http://localhost:1"})).json()["id"]
    r = await client.get(f"/api/v1/mcp/{sid}/tools", headers=h)
    assert r.status_code == 200
    assert r.json()["tools"] == []


@pytest.mark.asyncio
async def test_mcp_tools_parses_mock_server(client, owner, monkeypatch):
    """list_tools normalizes a mocked MCP /tools response."""
    h = owner["headers"]
    sid = (await client.post("/api/v1/mcp/", headers=h,
                             json={"name": "mock", "url": "http://mcp.test"})).json()["id"]

    class FakeResp:
        status_code = 200
        def json(self):
            return {"tools": [{"name": "read_file", "description": "reads", "input_schema": {}}]}

    class FakeClient:
        def __init__(self, *a, **k): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return False
        async def get(self, url, **k):
            return FakeResp() if url.endswith("/tools") else type("R", (), {"status_code": 404})()

    import app.services.mcp as mcp_mod
    monkeypatch.setattr(mcp_mod.httpx, "AsyncClient", FakeClient)

    r = await client.get(f"/api/v1/mcp/{sid}/tools", headers=h)
    assert r.status_code == 200
    tools = r.json()["tools"]
    assert tools[0]["name"] == "read_file"
    assert tools[0]["parameters"] == {}
