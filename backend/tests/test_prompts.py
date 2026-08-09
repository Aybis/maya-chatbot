"""B1: Prompt Library — org-scoped CRUD + categories."""
import pytest


@pytest.mark.asyncio
async def test_prompt_crud_lifecycle(client, owner):
    h = owner["headers"]
    # create
    r = await client.post("/api/v1/prompts/", headers=h, json={
        "name": "Welcome", "description": "d", "category": "writing",
        "content": "Hello {{name}}", "variables": ["name"], "is_public": True,
    })
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["variables"] == ["name"] and p["is_public"] is True

    # list
    lst = await client.get("/api/v1/prompts/", headers=h)
    assert any(x["id"] == p["id"] for x in lst.json())

    # get one
    one = await client.get(f"/api/v1/prompts/{p['id']}", headers=h)
    assert one.status_code == 200 and one.json()["name"] == "Welcome"

    # update
    upd = await client.put(f"/api/v1/prompts/{p['id']}", headers=h,
                           json={"category": "marketing", "description": "d2"})
    assert upd.status_code == 200
    assert upd.json()["category"] == "marketing"
    assert upd.json()["name"] == "Welcome"  # unchanged

    # categories
    cats = await client.get("/api/v1/prompts/categories", headers=h)
    assert "marketing" in cats.json()

    # filter by category
    flt = await client.get("/api/v1/prompts/?category=marketing", headers=h)
    assert all(x["category"] == "marketing" for x in flt.json())

    # delete
    d = await client.delete(f"/api/v1/prompts/{p['id']}", headers=h)
    assert d.status_code == 200
    gone = await client.get(f"/api/v1/prompts/{p['id']}", headers=h)
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_prompts_org_isolated(client, owner):
    import uuid
    from tests.conftest import _register, _auth
    u = uuid.uuid4().hex[:8]
    other = await _register(client, f"p_{u}@t.com", f"p_{u}")

    await client.post("/api/v1/prompts/", headers=owner["headers"],
                      json={"name": "Secret", "content": "x"})
    lst = await client.get("/api/v1/prompts/",
                           headers=_auth(other["access_token"], other["organizations"][0]["id"]))
    assert all(x["name"] != "Secret" for x in lst.json())


@pytest.mark.asyncio
async def test_prompts_requires_auth(client):
    r = await client.get("/api/v1/prompts/")
    assert r.status_code == 401
