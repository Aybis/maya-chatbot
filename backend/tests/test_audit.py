"""B3: Audit logs — recording + admin-gated viewing."""
import pytest

from tests.conftest import _register, _auth


@pytest.mark.asyncio
async def test_actions_are_logged(client, owner):
    h = owner["headers"]
    org_id = owner["organizations"][0]["id"]

    # login
    await client.post("/api/v1/auth/login", json={
        "email": owner["user"]["email"], "password": "Test123!"})
    # create + revoke an api key
    k = (await client.post("/api/v1/api-keys/", headers=h, json={"name": "ak"})).json()
    await client.delete(f"/api/v1/api-keys/{k['id']}", headers=h)

    logs = (await client.get("/api/v1/audit/", headers=h)).json()
    actions = {l["action"] for l in logs}
    assert "auth.register" in actions
    assert "auth.login" in actions
    assert "api_key.create" in actions
    assert "api_key.revoke" in actions


@pytest.mark.asyncio
async def test_audit_filter_and_actions_endpoint(client, owner):
    h = owner["headers"]
    (await client.post("/api/v1/api-keys/", headers=h, json={"name": "x"}))

    flt = await client.get("/api/v1/audit/?action=api_key.create", headers=h)
    assert flt.status_code == 200
    assert all(l["action"] == "api_key.create" for l in flt.json())

    acts = await client.get("/api/v1/audit/actions", headers=h)
    assert "api_key.create" in acts.json()


@pytest.mark.asyncio
async def test_audit_requires_admin(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    org_id = owner["organizations"][0]["id"]
    member = await _register(client, f"am_{u}@t.com", f"am_{u}")
    inv = await client.post(f"/api/v1/auth/organizations/{org_id}/invitations",
                            headers=owner["headers"],
                            json={"email": member["user"]["email"], "role": "member"})
    await client.post("/api/v1/auth/invitations/accept",
                      headers=_auth(member["access_token"]),
                      json={"token": inv.json()["token"]})

    r = await client.get("/api/v1/audit/", headers=_auth(member["access_token"], org_id))
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_audit_org_scoped(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    other = await _register(client, f"ao_{u}@t.com", f"ao_{u}")
    # other org's audit list must not contain owner's events
    logs = (await client.get("/api/v1/audit/",
                             headers=_auth(other["access_token"], other["organizations"][0]["id"]))).json()
    for l in logs:
        assert l["organization_id"] == other["organizations"][0]["id"]
