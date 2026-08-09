"""Phase A: auth (register/login/refresh) + org RBAC + invitations."""
import pytest

from tests.conftest import _auth, _register


# ── Auth ──

@pytest.mark.asyncio
async def test_register_creates_personal_org(client):
    import uuid
    u = uuid.uuid4().hex[:8]
    data = await _register(client, f"reg_{u}@t.com", f"reg_{u}")
    assert data["organizations"], "register should auto-create an org"
    assert data["organizations"][0]["id"]


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client, owner):
    r = await client.post("/api/v1/auth/register", json={
        "email": owner["user"]["email"], "username": "someoneelse", "password": "x12345",
    })
    assert r.status_code == 409


@pytest.mark.asyncio
async def test_login_ok_and_bad_password(client, owner):
    ok = await client.post("/api/v1/auth/login", json={
        "email": owner["user"]["email"], "password": "Test123!",
    })
    assert ok.status_code == 200
    assert ok.json()["access_token"]

    bad = await client.post("/api/v1/auth/login", json={
        "email": owner["user"]["email"], "password": "wrong",
    })
    assert bad.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_flow(client, owner):
    r = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": owner["refresh_token"],
    })
    assert r.status_code == 200
    body = r.json()
    assert body["access_token"] and body["refresh_token"]

    # New access token works
    me = await client.get("/api/v1/auth/me", headers=_auth(body["access_token"]))
    assert me.status_code == 200


@pytest.mark.asyncio
async def test_refresh_rejects_access_token(client, owner):
    # An access token must not be usable as a refresh token.
    r = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": owner["access_token"],
    })
    assert r.status_code == 401


# ── Org CRUD + membership ──

@pytest.mark.asyncio
async def test_create_org_and_list(client, owner):
    r = await client.post("/api/v1/auth/organizations",
                          headers=owner["headers"], json={"name": "Side Org"})
    assert r.status_code == 200
    org = r.json()
    assert org["slug"]

    lst = await client.get("/api/v1/auth/organizations", headers=owner["headers"])
    names = [o["name"] for o in lst.json()]
    assert "Side Org" in names


@pytest.mark.asyncio
async def test_org_membership_isolation(client, owner):
    # A non-member cannot read another org's members list.
    import uuid
    u = uuid.uuid4().hex[:8]
    outsider = await _register(client, f"out_{u}@t.com", f"out_{u}")
    org_id = owner["organizations"][0]["id"]
    r = await client.get(f"/api/v1/auth/organizations/{org_id}/members",
                         headers=_auth(outsider["access_token"]))
    assert r.status_code == 403


# ── Invitations + RBAC ──

@pytest.mark.asyncio
async def test_invite_accept_and_role(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    org_id = owner["organizations"][0]["id"]

    member = await _register(client, f"mem_{u}@t.com", f"mem_{u}")
    inv = await client.post(
        f"/api/v1/auth/organizations/{org_id}/invitations",
        headers=owner["headers"],
        json={"email": member["user"]["email"], "role": "member"},
    )
    assert inv.status_code == 200, inv.text
    token = inv.json()["token"]

    acc = await client.post("/api/v1/auth/invitations/accept",
                            headers=_auth(member["access_token"]),
                            json={"token": token})
    assert acc.status_code == 200

    # member is now in the org
    members = await client.get(f"/api/v1/auth/organizations/{org_id}/members",
                               headers=owner["headers"])
    ids = [m["user_id"] for m in members.json()]
    assert member["user"]["id"] in ids


@pytest.mark.asyncio
async def test_member_cannot_invite(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    org_id = owner["organizations"][0]["id"]

    member = await _register(client, f"m2_{u}@t.com", f"m2_{u}")
    inv = await client.post(f"/api/v1/auth/organizations/{org_id}/invitations",
                            headers=owner["headers"],
                            json={"email": member["user"]["email"], "role": "member"})
    await client.post("/api/v1/auth/invitations/accept",
                      headers=_auth(member["access_token"]),
                      json={"token": inv.json()["token"]})

    # member (not admin) tries to invite -> 403
    r = await client.post(f"/api/v1/auth/organizations/{org_id}/invitations",
                          headers=_auth(member["access_token"], org_id),
                          json={"email": "x@x.com", "role": "member"})
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_role_change_and_remove(client, owner):
    import uuid
    u = uuid.uuid4().hex[:8]
    org_id = owner["organizations"][0]["id"]
    member = await _register(client, f"m3_{u}@t.com", f"m3_{u}")
    inv = await client.post(f"/api/v1/auth/organizations/{org_id}/invitations",
                            headers=owner["headers"],
                            json={"email": member["user"]["email"], "role": "member"})
    await client.post("/api/v1/auth/invitations/accept",
                      headers=_auth(member["access_token"]),
                      json={"token": inv.json()["token"]})
    mid = member["user"]["id"]

    # promote to admin
    r = await client.put(f"/api/v1/auth/organizations/{org_id}/members/{mid}",
                         headers=owner["headers"], json={"role": "admin"})
    assert r.status_code == 200

    # remove
    r = await client.delete(f"/api/v1/auth/organizations/{org_id}/members/{mid}",
                            headers=owner["headers"])
    assert r.status_code == 200
