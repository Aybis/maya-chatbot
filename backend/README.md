# Maya Chat — Backend

FastAPI backend for Maya, a multi-tenant B2B agentic AI platform.

## Table of Contents
- [Requirements](#requirements)
- [Setup](#setup)
- [Running](#running)
- [Configuration](#configuration-env)
- [Database](#database)
- [Multi-Tenancy & RBAC](#multi-tenancy--rbac)
- [Provider Registry](#provider-registry)
- [Auth](#auth)
- [API Reference](#api-reference)
- [Architecture](#architecture)

## Requirements
- Python 3.9+ (the project venv is Python 3.9)
- SQLite (dev, bundled)

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # or: ./venv/bin/python
pip install -r requirements.txt
cp .env.example .env              # then edit your keys
```

## Running

> ⚠️ **Critical:** the ambient `PYTHONPATH` on this machine points at the Hermes
> venv (Python 3.11) which breaks Python 3.9 packages. Always strip it and use
> the venv's interpreter directly.

```bash
env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: `GET /health` → `{"status":"ok"}`

## Configuration (`.env`)

Copy `.env.example` → `.env`. All values are loaded by `app/core/config.py`.

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite path | `sqlite+aiosqlite:///./maya_chat.db` |
| `JWT_SECRET` | **Set a real secret in production** | `your-secret-key-change-in-production` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `30` |
| `DEFAULT_PROVIDER` | Legacy default provider name | `openai` |
| `DEFAULT_MODEL` | Legacy default model | `gpt-4o` |
| `TRACK_TOKENS` | Enable token/cost tracking | `true` |
| `COST_ALERT_THRESHOLD` | Daily cost alert threshold ($) | `5.0` |
| `WEB_SEARCH_ENABLED` | Web search capability flag | `true` |

> **Note:** OpenAI/Anthropic/OpenRouter/Surplus API keys in `.env` are legacy.
> The recommended path is the **dynamic provider registry** (see below) where each
> org configures its own providers via the API/UI with `base_url` + `api_key`.

## Database

SQLite database at `backend/maya_chat.db`. Schema is created idempotently on
startup (`CREATE TABLE IF NOT EXISTS`). Additive migrations are handled by
`_ensure_columns()` — new columns are `ALTER TABLE`-added to existing tables,
so upgrades are non-destructive.

If you need to start fresh: stop the server and delete `maya_chat.db`.

## Multi-Tenancy & RBAC

- **Organization** = tenant boundary. Every resource has `organization_id`.
- **memberships** (`organizations_users`) link users ↔ orgs with a role.
- **Roles:** `owner` > `admin` > `member` (see `services/organizations.py::role_at_least`).
- Data isolation is enforced by always filtering queries by `organization_id`.

### Org context dependency
Most routes use `Depends(get_org_context)` which resolves the active org from
(in order) the `X-Org-Id` header → `org_id` query param → token claim. It
returns `{user_id, org_id, membership_role}` and raises 403 if the user isn't
a member.

```python
from fastapi import Depends
from app.services.auth import get_org_context

@router.get("/")
async def list(ctx: dict = Depends(get_org_context)):
    cur = await db.execute("SELECT * FROM projects WHERE organization_id = ?", (ctx["org_id"],))
    ...
```

## Provider Registry

Providers are stored in the DB (`providers` + `provider_models` tables), per-org.
Each provider = `base_url` + `api_key`. Models are auto-discovered from the
provider's OpenAI-compatible `/models` endpoint and stored with capability
metadata (reasoning, vision, audio, file_input, multimodal, context_window).

Capability inference lives in `services/providers.py::infer_capabilities` —
it prefers explicit provider metadata, then id heuristics.

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/providers/` | Add provider + auto-discover models |
| GET | `/api/v1/providers/` | List org's providers (with models) |
| POST | `/api/v1/providers/{id}/models/refresh` | Re-discover models |
| POST | `/api/v1/providers/{id}/default` | Set default provider |
| DELETE | `/api/v1/providers/{id}` | Remove provider |
| GET | `/api/v1/providers/models` | Flat list of all models + capabilities |

### Model reference in chat
A model is referenced as `provider_name/model_id` (e.g. `shiteru/deepseek-v4-flash`),
or just `model_id` to use the org's default provider.

## Auth

- **Register** auto-creates a personal organization and returns access + refresh tokens.
- **Access token:** 15 min, `type: "access"`, carries `sub` (user) + `org` claim.
- **Refresh token:** 30 days, `type: "refresh"`, exchanged at `/auth/refresh`.
- Passwords hashed with PBKDF2 (SHA-256, 100k iterations).
- WebSocket auth: pass the access token as `?token=` query param.

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | — | Register (auto-creates org) |
| POST | `/api/v1/auth/login` | — | Login → access+refresh tokens + orgs |
| POST | `/api/v1/auth/refresh` | refresh | Rotate tokens |
| GET | `/api/v1/auth/me` | access | Current user + orgs |
| POST | `/api/v1/auth/organizations` | access | Create org |
| GET | `/api/v1/auth/organizations` | access | List my orgs |
| GET | `/api/v1/auth/organizations/{id}/members` | access | Org members |
| POST | `/api/v1/auth/organizations/{id}/invitations` | admin+ | Invite member |
| POST | `/api/v1/auth/invitations/accept` | access | Accept invitation |
| PUT | `/api/v1/auth/organizations/{id}/members/{uid}` | admin+ | Change role |
| DELETE | `/api/v1/auth/organizations/{id}/members/{uid}` | admin+ | Remove member |
| CRUD | `/api/v1/projects/` | org | Projects |
| CRUD | `/api/v1/chat/conversations/` | org | Conversations |
| GET | `/api/v1/chat/conversations/{id}/messages` | org | Messages |
| CRUD | `/api/v1/memory/` | org | Memories |
| CRUD | `/api/v1/skills/` | org | Skills |
| POST | `/api/v1/files/upload` | org | File upload |
| GET | `/api/v1/analytics/usage/*` | org | Usage/cost analytics |
| GET | `/api/v1/providers/*` | org | Provider registry |
| WS | `/ws/chat?token=...` | access | Streaming chat |

> Collection routes are defined under `/` (e.g. `/projects/`). Call them with a
> trailing slash — FastAPI redirects no-slash → slash and drops auth headers on
> the redirect.

## Architecture

```
backend/app/
├── main.py                  # FastAPI app, CORS, router registration
├── core/config.py           # Settings (pydantic-settings, reads .env)
├── db/database.py           # SQLite schema + additive migrations
├── models/schemas.py        # Pydantic schemas
├── services/
│   ├── auth.py              # JWT access+refresh, org context dependency
│   ├── organizations.py     # Org CRUD, memberships, RBAC, invitations
│   ├── providers.py         # Provider registry, model discovery, capabilities
│   ├── llm.py               # OpenAI-compatible streaming via provider registry
│   ├── memory.py            # Memory context builder
│   └── token_tracker.py     # Token/cost tracking (org-scoped)
├── api/
│   ├── routes/              # auth, providers, projects, chat, memory, skills, files, analytics
│   └── websocket/chat.py    # WebSocket streaming (token-authenticated)
```

## Testing

```bash
env -u PYTHONPATH ./venv/bin/python -m pytest
```