# AGENTS.md — Maya Chat

> Guidance file for AI coding agents (Claude Code, Codex, Hermes, etc.) working in this repo. Read this before making changes.

## Project
Maya Chat — a Claude-style B2B SaaS AI chat application. Multi-provider LLM routing (OpenAI, Anthropic, OpenRouter, 9Router, Surplus), real-time streaming, token/cost tracking. Being rebuilt as a scalable B2B SaaS (multi-tenant, RBAC, billing-ready).

## Stack
- **Backend:** Python 3.9, FastAPI, aiosqlite (SQLite), WebSocket streaming, PyJWT
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Zustand, React Query
- **Design:** Apple/Mobbin-minimalist (see progress.md Design Direction + architect.md)

## Critical Environment Constraints
1. **NEVER run backend with the ambient `PYTHONPATH`.** It points at the Hermes venv (Python 3.11) which breaks the project's Python 3.9 venv. Always:
   ```bash
   cd backend && env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app
   ```
2. **venv shebangs are stale** after the move to `/Users/horus/Sandbox/maya-chat`. Use `python -m <tool>` instead of `venv/bin/<tool>`.
3. Frontend: `cd frontend && npm run dev` (port 5173). Backend port 8000.

## Workspace & Conventions
- All new projects/docs go in `/Users/horus/Sandbox/` (this repo lives at `/Users/horus/Sandbox/maya-chat`).
- User prefers **sidebar navigation** over tabs for dashboards.
- Dashboard landing = high-level summary (stats + charts + recent activity); system stats get their own page.

## Contribution Rules
- Update `progress.md` at the end of every session.
- Keep the data layer idempotent (CREATE TABLE IF NOT EXISTS) and migration-safe.
- SQLite is the dev DB; design the data layer so it can move to Postgres for production multi-tenancy.
- Follow the design tokens in `architect.md` — do not introduce new accent colors, fonts, or shadow styles.

## Testing
```bash
cd backend && env -u PYTHONPATH ./venv/bin/python -m pytest
# frontend
cd frontend && npm run test
```