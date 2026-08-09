---
name: maya-chat-feature
description: Add features to Maya Chat. Use when implementing new functionality — multi-tenant, providers, chat, skills, analytics, auth.
---

# Maya Chat Feature Implementation

## Tech Stack
- **Backend**: FastAPI + aiosqlite + WebSocket, pydantic-settings
- **Frontend**: React 19 + Vite 8 + TypeScript + Tailwind 4 + Zustand + React Query 5
- **LLM**: Dynamic provider registry (any OpenAI-compatible base_url + api_key)
- **Design**: White minimalist premium (Geist fonts, Phosphor icons, hairline borders, one accent)

## Architecture Rules (MULTI-TENANT)
1. ALL routes use `get_org_context` dependency → returns `{user_id, org_id, membership_role}`. Resolves org from `X-Org-Id` header (or token/query).
2. Every resource is org-scoped — filter by `organization_id` in every query.
3. RBAC via `role_at_least(role, min)` — owner > admin > member.
4. Streaming via WebSocket at `/ws/chat`. **Auth via `?token=` query param** (access JWT).
5. Token tracking on every LLM request, org-scoped.
6. Providers are DB rows (base_url + api_key), models auto-discovered with capability metadata.
7. Frontend state via Zustand (`auth.ts`); server state via React Query (must be wrapped in `QueryClientProvider` in `main.tsx`).

## Adding a New Feature

### Backend
1. Add schema in `app/db/database.py` (idempotent `CREATE TABLE IF NOT EXISTS` + `_ensure_columns` for additive migration)
2. Add service logic in `app/services/`
3. Create route file in `app/api/routes/` — use `Depends(get_org_context)`
4. Register in `app/api/routes/__init__.py`

### Frontend
1. Add types in `src/types/index.ts`
2. Add API calls in `src/api/client.ts` — **use trailing slashes** on collection routes (FastAPI redirects no-slash → slash and drops auth headers)
3. Add page in `src/pages/`, register route in `App.tsx`
4. Use design tokens (canvas/surface/line/ink/muted/accent) + Phosphor icons

## Design System (Apple/Mobbin minimalist)
- Fonts: Geist Variable (UI), Geist Mono (code). NO Inter.
- Colors: canvas `#FFFFFF`, surface `#F9F9F8`, line `#EAEAEA`, ink `#111111`, muted `#787774`, accent `#4a6cf7`.
- No heavy shadows (`shadow-md/lg/xl` banned). Hairline `1px solid #EAEAEA`, radius 8–12px.
- Icons: Phosphor (`@phosphor-icons/react`). Never Lucide.
- No emojis in UI. Motion via `translateY(12px)` fade, 600ms `cubic-bezier(0.16,1,0.3,1)`.