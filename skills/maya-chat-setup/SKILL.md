---
name: maya-chat-setup
description: Quick setup guide for Maya Chat development. Use when starting work on the project, setting up dev environment, or onboarding.
---

# Maya Chat Setup

## Prerequisites
- Python 3.9+ (backend venv is Python 3.9)
- Node.js 18+ (frontend uses latest React 19 / Vite 8)
- pnpm or npm

## Quick Start

```bash
# Backend
cd backend
./venv/bin/python -m pip install -r requirements.txt
env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

App: http://localhost:5173 | API: http://localhost:8000

## ⚠️ Critical Environment Constraint
The ambient `PYTHONPATH` points at the Hermes venv (Python 3.11) which breaks the
project's Python 3.9 venv. **Always run the backend with `env -u PYTHONPATH`** and
use `python -m <tool>` (venv shebangs are stale after the move to `/Users/horus/Sandbox/maya-chat`).

```bash
cd backend && env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app
```

## Environment
Copy `backend/.env.example` to `backend/.env` and configure:
- `DEFAULT_PROVIDER` / `DEFAULT_MODEL`
- Provider API keys (OpenAI, Anthropic, OpenRouter, Surplus)
- `NINE_ROUTER_URL` + `NINE_ROUTER_ENABLED` (optional local proxy)
- `JWT_SECRET` (set a real secret in production)

## Multi-tenant architecture
- **Organizations** are the tenant boundary. Every resource is org-scoped (`organization_id`).
- Roles: `owner` / `admin` / `member` (RBAC via `organizations_users`).
- Providers are dynamic (base_url + api_key) stored in the DB, models auto-discovered with capabilities.
- Auth: access (15m) + refresh (30d) JWT. `get_org_context` dependency resolves org from `X-Org-Id`.