import os
import tempfile

import aiosqlite
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Point the app at a throwaway DB BEFORE any app module is imported.
_tmpdir = tempfile.mkdtemp(prefix="maya_test_")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_tmpdir}/test.db"

from app.main import app  # noqa: E402
from app.db import database  # noqa: E402
from app.db.database import init_db  # noqa: E402


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _setup_db():
    await init_db()
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def db():
    """Direct DB handle for assertions/seed that bypass the API."""
    conn = await aiosqlite.connect(database.DB_PATH)
    conn.row_factory = aiosqlite.Row
    yield conn
    await conn.close()


@pytest.fixture
def ws_client():
    """Sync Starlette TestClient with in-process WebSocket support."""
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c


# ── Helpers ──

async def _register(client, email, username, password="Test123!"):
    r = await client.post("/api/v1/auth/register", json={
        "email": email, "username": username, "password": password,
    })
    assert r.status_code == 200, r.text
    return r.json()


def _auth(token, org_id=None):
    h = {"Authorization": f"Bearer {token}"}
    if org_id:
        h["X-Org-Id"] = org_id
    return h


@pytest_asyncio.fixture
async def owner(client):
    """A registered user who owns their auto-created org."""
    import uuid
    u = uuid.uuid4().hex[:8]
    data = await _register(client, f"owner_{u}@t.com", f"owner_{u}")
    data["headers"] = _auth(data["access_token"], data["organizations"][0]["id"])
    return data
