# AGENTS.md — Maya Chat

> Guidance file for AI coding agents (Claude Code, Codex, Hermes, etc.) working in this repo. Read this before making changes.

## Project
Maya Chat — a multi-tenant B2B SaaS agentic AI platform. Dynamic provider routing (OpenAI-compatible base_url+api_key), real-time streaming, token/cost tracking, RBAC, billing-ready.

## Stack
- **Backend:** Python 3.9, FastAPI, aiosqlite (SQLite), WebSocket streaming, PyJWT
- **Frontend:** React 19, Vite 8, TypeScript, Tailwind 4, Zustand, React Query 5
- **Design:** Apple/Mobbin minimalist (see `docs/ARCHITECT.md` Design Direction + `skills/frontend-design/`)

## Critical Environment Constraints
1. **NEVER run backend with the ambient `PYTHONPATH`.** It points at the Hermes venv (Python 3.11) which breaks the project's Python 3.9 venv. Always:
   ```bash
   cd backend && env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app
   ```
2. **venv shebangs are stale** after the move to `/Users/horus/Sandbox/maya-chat`. Use `python -m <tool>` instead of `venv/bin/<tool>`.
3. Frontend: `cd frontend && npm run dev` (port 5173). Backend port 8000.
4. React Query MUST be wrapped in `QueryClientProvider` (in `main.tsx`) — pages use `useQuery`.
5. API collection routes need **trailing slashes** (`/projects/`) — FastAPI redirects no-slash → slash and drops auth headers.

## Workspace & Conventions
- All new projects/docs go in `/Users/horus/Sandbox/` (this repo lives at `/Users/horus/Sandbox/maya-chat`).
- User prefers **sidebar navigation** over tabs for dashboards.
- Dashboard landing = high-level summary; system stats get their own page.
- All docs live in `docs/`. Skills live in the single `skills/` folder.

## Contribution Rules
- Update `docs/progress.md` at the end of every session.
- All routes use `Depends(get_org_context)` → `{user_id, org_id, membership_role}`. Filter by `organization_id`.
- Keep the data layer idempotent (CREATE TABLE IF NOT EXISTS + `_ensure_columns` for additive migration).
- SQLite is the dev DB; design the data layer so it can move to Postgres for production multi-tenancy.
- Follow the design tokens in `skills/frontend-design/` — do not introduce new accent colors, fonts, or shadow styles.
- Use Phosphor icons (`@phosphor-icons/react`), never Lucide.

## Testing
```bash
cd backend && env -u PYTHONPATH ./venv/bin/python -m pytest
# frontend
cd frontend && npm run build   # tsc + vite build
```