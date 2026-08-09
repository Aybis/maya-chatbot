import pytest


@pytest.mark.asyncio
async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_and_me(client, owner):
    assert owner["access_token"]
    r = await client.get("/api/v1/auth/me", headers=owner["headers"])
    assert r.status_code == 200
    assert r.json()["id"] == owner["user"]["id"]
