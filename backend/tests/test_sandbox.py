"""B5: Code execution sandbox — languages, limits, auth (API key + JWT)."""
import pytest

from app.services.sandbox import execute_code


# ── service-level (no HTTP) ──

@pytest.mark.asyncio
async def test_python_exec():
    r = await execute_code("python", 'print("hi")')
    assert r["exit_code"] == 0 and "hi" in r["stdout"]


@pytest.mark.asyncio
async def test_js_exec():
    r = await execute_code("js", 'console.log("js " + (2+2))')
    assert r["exit_code"] == 0 and "js 4" in r["stdout"]


@pytest.mark.asyncio
async def test_exit_code_passthrough():
    r = await execute_code("python", "import sys; sys.exit(3)")
    assert r["exit_code"] == 3


@pytest.mark.asyncio
async def test_stderr_captured():
    r = await execute_code("python", 'import sys; sys.stderr.write("oops\\n")')
    assert "oops" in r["stderr"]


@pytest.mark.asyncio
async def test_timeout():
    r = await execute_code("python", "import time\ntime.sleep(60)", timeout=2)
    assert r["timed_out"] is True and r["exit_code"] is None


@pytest.mark.asyncio
async def test_unsupported_language():
    r = await execute_code("ruby", "puts 1")
    assert "error" in r


# ── HTTP endpoint ──

@pytest.mark.asyncio
async def test_execute_requires_auth(client):
    r = await client.post("/v1/execute", json={"language": "python", "code": "print(1)"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_execute_with_api_key(client, owner):
    key = (await client.post("/api/v1/api-keys/", headers=owner["headers"],
                             json={"name": "exec"})).json()["key"]
    r = await client.post("/v1/execute",
                          headers={"Authorization": f"Bearer {key}"},
                          json={"language": "python", "code": 'print("via key")'})
    assert r.status_code == 200
    assert "via key" in r.json()["stdout"]


@pytest.mark.asyncio
async def test_execute_with_jwt(client, owner):
    r = await client.post("/v1/execute",
                          headers=owner["headers"],
                          json={"language": "python", "code": 'print("via jwt")'})
    assert r.status_code == 200
    assert "via jwt" in r.json()["stdout"]
