# Maya Chat — Live Progress

> **Purpose:** This is the single source of truth for what's done, what's in progress, and what's next. If a session is interrupted (token limit, crash), the next session reads THIS file to resume. **Always update this file at the end of every working session.**

---

## Current Status

**Phase:** B — IN PROGRESS (B1, B2, B3 done; B6 Admin Console next, then B4 MCP / B5 Sandbox)
**Last updated:** Phase B, B3 done

<!-- UPDATE BELOW as you work. Keep this section current. -->

### In Progress
- (none — B1, B2, B3 complete; B6 next)

### Completed
- [x] **B3 Audit Logs** — `audit_logs` table (org-scoped; action/resource/ip/user_agent/metadata JSON); `services/audit.py` `log_audit()` (fire-and-forget, never raises). Wired into: register, login, org.create, member.invite/role_change/remove, api_key.create/revoke, provider.add/remove. `/api/v1/audit/` list (paginated, `?action=` filter, admin/owner gated via `role_at_least`) + `/audit/actions`. AuditLogsPage (`/app/audit`) — table with color-coded action badges, action filter chips, 403 access-denied state for non-admins; sidebar entry. Verified: all 6 action types recorded (org.create correctly logged to the newly-created org), filter + actions endpoints work, `npm run build` clean.
- [x] **B2 API Keys + OpenAI-compatible `/v1/chat/completions`** — `api_keys` table (SHA-256 hash only, `prefix` for display, revoked/expires/last_used); `services/api_keys.py` (generate/hash/resolve/touch); `/api/v1/api-keys/` create→show-once/list/revoke; public `/v1/chat/completions` (mounted at app root, `Authorization: Bearer maya_...`, resolves org from key, routes via org provider registry, OpenAI SSE chunks for `stream:true`). ApiKeysPage (`/app/api-keys`) with one-time-secret banner + copy + revoke; sidebar entry. Verified: create→list (no plaintext leak)→no-auth 401→bad-key 401→live non-stream 200 "PONG"→live stream SSE `[DONE]`→revoke→401.
- [x] **B1 Prompt Library** — `prompt_templates` table (org-scoped, categories + variables JSON + is_public); CRUD routes at `/api/v1/prompts/` (+ list-by-category, `/categories`, PUT update); PromptsPage (`/app/prompts`) with category filter, create/edit/delete/copy; sidebar entry. Verified end-to-end via live API (create/list/get/update/by-category/categories/delete) + `npm run build` (tsc clean).
- [x] Project recon
- [x] Docs scaffold (this file + AGENTS.md + ARCHITECT.md + SKILLS.md)
- [x] Design direction locked (taste-skill: minimalist/premium, VARIANCE 5 / MOTION 3 / DENSITY 2)
- [x] **Phase A backend: multi-tenant schema** — organizations, memberships (RBAC owner/admin/member), invitations, schema_migrations, org_id on all resources
- [x] **Phase A auth upgrade** — access + refresh JWT, org context dependency (`X-Org-Id` header / token claim), org CRUD + members + invitations routes
- [x] **Org-scoped API routes** — projects, conversations, memory, skills, files, analytics, WebSocket all scoped to org
- [x] **Dynamic provider registry** — `providers` + `provider_models` tables; base_url + api_key; auto-discover models from `/models` endpoint; capability inference (reasoning, vision, audio, file, multimodal, context window); LLM service routes via DB registry
- [x] **All libraries latest + 0 vulns** — backend (fastapi 0.128, uvicorn 0.39, pydantic 2.13, httpx 0.28, openai 2.48, anthropic 0.121, cryptography 50); frontend (React 19.2, Vite 8.2, TS 7.0, router 7.18, Tailwind 4.3). `npm audit` 0 vulns.
- [x] **Design system** — white minimalist premium tokens, Geist fonts, Phosphor icons, `.hairline`/`.lift`/`.reveal` utilities
- [x] **Enterprise landing page** — public at `/`, app at `/app/*`
- [x] **Bug fixes** — QueryClientProvider wrapper (crashes), trailing-slash API routes (401 redirect), WebSocket token auth, org-context fallback (stale-token 400), legacy-account org auto-create (403), provider-add clear error msg
- [x] **Design system applied to all app pages** — all migrated to tokens + Phosphor; lucide-react removed
- [x] **Maya logo applied** — nav, login, register, sidebar, favicon, chat avatar
- [x] **Docs reorganized** — all MD in `docs/`, skills consolidated in `skills/`, `backend/README.md` added

---

## Project Map

| Layer | Stack | Location |
|-------|-------|----------|
| Backend | Python / FastAPI / aiosqlite (SQLite) | `backend/app/` |
| Frontend | React / Vite / TypeScript / Tailwind | `frontend/src/` |
| DB | SQLite | `backend/maya_chat.db` |

**Running:** backend `:8000`, frontend `:5173`
**Notes:**
- Backend must run with `env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app` (PYTHONPATH points at Hermes venv otherwise).
- venv shebangs are stale after the move to `/Users/horus/Sandbox/maya-chat` — use `python -m` not the bin script.

---

## Roadmap

### Phase A — Multi-tenant SaaS foundation (CURRENT)
- Organizations / workspaces as tenant boundary
- Roles: Owner / Admin / Member (RBAC)
- Team invitations, org-scoped data isolation
- JWT + refresh tokens, org context in requests
- Billing-ready abstractions (plan, seats, quotas)

### Phase B — Claude features
- MCP (Model Context Protocol) support
- Code execution sandbox
- Prompt library + model routing
- API keys for customers
- Admin console + audit logs

### Phase C — B2B services
- Stripe billing (plans, seats, usage-based)
- Webhooks, rate limiting, team management UI

---

## Design Direction (locked)

**Reference:** taste-skill (https://github.com/leonxlnx/taste-skill) — minimalist-skill + taste-skill.
**Read:** B2B SaaS product UI for technical buyers; premium Apple/Mobbin minimalist; white monochrome + one accent.
**Dials:** `VARIANCE: 5` · `MOTION: 3` · `DENSITY: 2`.

### Design Rules (from minimalist-skill)
- **Fonts:** SF Pro Display / Geist Sans for UI; Geist Mono / SF Mono for code & meta. NO Inter/Roboto/Open Sans defaults.
- **Canvas:** Pure white `#FFFFFF` / warm bone `#F7F6F3`. Cards `#FFFFFF`/`#F9F9F8`.
- **Borders:** `1px solid #EAEAEA` everywhere. Radius 8–12px max (crisp, not pill).
- **Accent:** 1 desaturated accent only. Muted pastels for tags/badges.
- **Shadows:** practically none (< 0.05 opacity, ultra-diffuse). No `shadow-md/lg/xl`.
- **Buttons:** Solid `#111111` bg, white text, radius 4–6px, no shadow, hover `scale(0.98)`.
- **Icons:** Phosphor (Bold/Fill) or Radix UI. Never Lucide. Single family, consistent stroke.
- **No emojis.** No gradients. No glassmorphism (beyond subtle nav blur).
- **Motion:** invisible — fade + `translateY(12px)` over 600ms `cubic-bezier(0.16,1,0.3,1)`, IntersectionObserver only.
- **Layout:** macro whitespace (py-24/32), content `max-w-4xl/5xl`, bento grids with 1px borders.