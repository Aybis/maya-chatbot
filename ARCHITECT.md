# ARCHITECT.md — Maya Chat Architecture

> The living architecture document. Describes the multi-tenant B2B SaaS design as it's built. Read this before touching backend data model or frontend routing.

## Current Architecture (as-built Phase A)

### Backend — FastAPI + SQLite
```
backend/app/
├── main.py                  # FastAPI app, CORS, router registration
├── core/config.py           # Settings (pydantic-settings)
├── db/database.py           # SQLite schema + init (aiosqlite)
├── models/schemas.py        # Pydantic schemas
├── services/
│   ├── auth.py              # JWT, password hashing, get_current_user
│   ├── llm.py               # Multi-provider LLM routing
│   ├── memory.py            # Memory context builder
│   └── token_tracker.py     # Cost calculation
├── api/
│   ├── routes/              # auth, chat, projects, memory, skills, files, analytics
│   └── websocket/chat.py    # WebSocket streaming
```

### Frontend — React / Vite / TS / Tailwind
```
frontend/src/
├── App.tsx                  # Routes
├── api/client.ts            # REST client
├── stores/auth.ts           # Zustand auth store
├── components/              # Layout, Sidebar, ChatMessage, ChatInput, etc.
├── pages/                   # Chat, Projects, Memory, Skills, Analytics, Settings, Login, Register
└── hooks/useWebSocket.ts
```

### Data Model (current)
`users`, `projects`, `conversations`, `messages`, `memories`, `skills`, `files`, `token_usage`.
All currently keyed off `user_id` — **single tenant.**

---

## Target Architecture (Phase A — multi-tenant)

### Multi-tenancy model
- **Organization** = tenant boundary. Owns projects, conversations, memories, files, settings.
- **User** belongs to many orgs via **membership** (role: owner/admin/member).
- **Invitation** — owner/admin invites a user by email; invitee gains membership on accept.
- Full data isolation: every resource has `organization_id`, and every query filters by the requesting user's org membership.

### New tables
| Table | Purpose |
|-------|---------|
| `organizations` | The tenant. name, slug, plan, settings, created_by |
| `organizations_users` (memberships) | user ↔ org, role (owner/admin/member), joined_at |
| `invitations` | email, org_id, role, token, status, invited_by, expires_at |
| `api_keys` (Phase B) | customer API access |
| `audit_logs` (Phase B) | compliance trail |

### RBAC
- **owner** — manage org, billing, members, delete org
- **admin** — manage members, projects, invite
- **member** — use org resources (chat, artifacts), view
- Enforced via FastAPI dependency `require_org_membership(org_id, min_role)`.

### Auth (upgrade)
- Current: single JWT (7-day), `get_current_user` returns user_id.
- Target: **access + refresh tokens**. Access short-lived (15m), refresh long-lived w/ rotation. Org context plumbed through the request.
- Keep PBKDF2 hashing; move JWT secret to env.

### Org context flow
1. Client authenticates → gets user + list of memberships.
2. Client picks an org → sends `X-Org-Id` header (or `org_id` query param).
3. Backend resolves org membership → scopes all queries + enforces role.

---

## Design Tokens (Phase A frontend)

Reference: progress.md → Design Direction. Locked values:

| Token | Value |
|-------|-------|
| Canvas bg | `#FFFFFF` / `#F7F6F3` |
| Card surface | `#FFFFFF` / `#F9F9F8` |
| Border | `1px solid #EAEAEA` |
| Text primary | `#111111` |
| Text secondary | `#787774` |
| Radius | 8–12px (crisp) |
| Font UI | Geist Sans / SF Pro Display |
| Font mono | Geist Mono / SF Mono |
| Accent | ONE desaturated tone (TBD — pick in Phase A frontend) |
| Shadow | none / <0.05 opacity diffuse |
| Button | bg `#111111`, text `#FFFFFF`, radius 4–6px |

---

## Migration Paths
- **DB:** aiosqlite now, SQLAlchemy or raw SQL later. Keep schema idempotent. Add a simple `schema_migrations` table for versioned migrations.
- **Postgres:** swap aiosqlite driver for asyncpg; add RLS later for hard tenant isolation.
- **Docker:** containerize backend + frontend when ready to deploy behind Tailscale.

## Decisions Log
- **Decision:** Multi-tenant via shared DB + `organization_id` column (row-level scoping), not one-DB-per-tenant. Simpler, fits SQLite dev, Postgres RLS later. — Phase A
- **Decision:** Keep SQLite for dev; design for Postgres. — Phase A
- **Decision:** Design direction = minimalist/premium (Apple/Mobbin), neutrons white + one accent. — Phase A