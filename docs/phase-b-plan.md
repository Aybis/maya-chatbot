# Phase B — Claude-Style Features & B2B SaaS Capabilities

> **Status: PLANNED — not started.** This is the work order for the next session.
> Read `docs/progress.md` first for what's done, then execute Phase B below.
> Update `docs/progress.md` at the end of each working session.

---

## Context (read before starting)

Phase A is complete and committed. The app is a multi-tenant B2B SaaS with:
- Orgs + RBAC (owner/admin/member), invitations, org-scoped data
- Access+refresh JWT, org context via `X-Org-Id` / token claim / DB fallback
- Dynamic provider registry (base_url + api_key, auto model discovery + capabilities)
- White minimalist premium design system (Geist, Phosphor, tokens)
- Enterprise landing page at `/`, app at `/app/*`

**Repo:** `/Users/horus/Sandbox/maya-chat` · remote `Aybis/maya-chatbot`
**Run:** backend `env -u PYTHONPATH ./venv/bin/python -m uvicorn app.main:app` (:8000) · frontend `npm run dev` (:5173)

---

## Phase B Scope (Claude-style features + B2B services)

### B1 — Prompt Library ⭐ START HERE (quick win, high value)
Reusable prompt templates, org-scoped, with categories + variables.

**Backend:**
- Table `prompt_templates` (id, organization_id, name, description, category, content, variables JSON, is_public, created_by, timestamps)
- Routes in `app/api/routes/prompts.py`: CRUD + list-by-category
- Register in `app/api/routes/__init__.py`
- Additive migration via `_ensure_columns` if needed

**Frontend:**
- Page `src/pages/PromptsPage.tsx`, route `/app/prompts`, sidebar entry
- Uses design tokens + Phosphor; CRUD UI with category filter

**Verify:** create/list/delete a template via API + UI.

### B2 — API Keys for Customers (B2B core)
Let orgs issue API keys so customers can call Maya programmatically (OpenAI-compatible).

**Backend:**
- Table `api_keys` (id, organization_id, name, key_hash, prefix, created_by, last_used_at, expires_at, revoked)
- Store only a **hash** of the key; show the plaintext once at creation.
- Routes `app/api/routes/api_keys.py`: create/list/revoke
- An OpenAI-compatible endpoint `/v1/chat/completions` that accepts `Bearer <api_key>`, resolves org by key, and streams via the org's provider registry.

**Frontend:**
- Page `src/pages/ApiKeysPage.tsx` (list, create→show-once, revoke), route `/app/api-keys`

**Verify:** create key → call `/v1/chat/completions` with it → get a response; revoke → 401.

### B3 — Audit Logs (compliance)
Record security-relevant actions per org.

**Backend:**
- Table `audit_logs` (id, organization_id, user_id, action, resource_type, resource_id, ip, user_agent, created_at)
- Helper `log_audit(db, ...)` called on: login, org create, member invite/role change/remove, key create/revoke, provider add/remove.
- Routes: list (paginated, filter by action/date), admin-only for non-owner roles.

**Frontend:**
- Page `src/pages/AuditLogsPage.tsx`, route `/app/audit`, admin/owner gated.

### B4 — MCP Support (Model Context Protocol)
Let the assistant use external tools/servers.

**Backend:**
- Register MCP servers per org: table `mcp_servers` (id, organization_id, name, url, enabled)
- A lightweight MCP client that can list tools and call them; expose enabled tools to the chat streaming path.
- (Scope note: full MCP spec is large. Start with an **HTTP/SSE tool-call integration** — list tools + invoke — rather than a full MCP SDK.)

**Frontend:**
- Page `src/pages/McpPage.tsx` to manage servers.

### B5 — Code Execution Sandbox
Run user code safely (artifacts).

**Backend:**
- A `/v1/execute` endpoint that runs code in a **container or subprocess sandbox** (cpu/memory/time limits, no network).
- Whitelisted languages: python, js, (maybe shell).
- Return stdout/stderr/exit code; cap output size.

**Verify:** execute a hello-world + a flagged-but-safe snippet.

### B6 — Admin Console (org-level)
Org owner dashboard: members, usage, keys, audit, plan.

**Frontend:**
- Page `src/pages/AdminPage.tsx` (owner/admin), route `/app/admin`
- Aggregates existing data (members, analytics, keys, audit) into one screen.

---

## Suggested Order & Effort

| Order | Feature | Effort | Priority |
|-------|---------|--------|----------|
| 1 | B1 Prompt Library | S | High |
| 2 | B2 API Keys + `/v1/chat/completions` | M | High (B2B core) |
| 3 | B3 Audit Logs | M | High (compliance) |
| 4 | B6 Admin Console | S | Med |
| 5 | B4 MCP (tool integration) | L | Med |
| 6 | B5 Code Sandbox | L | Med |

Do B1→B3 first (they're the SaaSecess core + quick). B4/B5 are bigger; do them after.

---

## Conventions (MUST follow)

1. **Backend:** every route uses `Depends(get_org_context)` → `{user_id, org_id, membership_role}`. Filter by `organization_id`. RBAC via `role_at_least`.
2. **Additive DB:** `CREATE TABLE IF NOT EXISTS` + `_ensure_columns` for new columns. Never drop the DB.
3. **Frontend:** design tokens (canvas/surface/line/ink/muted/accent), Phosphor icons (`@phosphor-icons/react`), trailing slashes on collection routes, `QueryClientProvider` already set. No lucide, no emojis, no heavy shadows.
4. **Auth:** access token 15m, refresh 30d. WebSocket uses `?token=`.
5. **Commit + push** after each feature (small, reviewable commits).
6. Update `docs/progress.md` at end of each session.

## Verification Standard
- Run `npm run build` (tsc) after frontend changes.
- Exercise each new endpoint via curl/API after backend changes.
- If a pytest suite exists, run it; otherwise this is ad-hoc verification (label it clearly).

---

## Definition of Done (Phase B)
- [ ] Prompt Library (B1) working end-to-end
- [ ] API Keys + OpenAI-compatible `/v1/chat/completions` (B2)
- [ ] Audit Logs (B3) recording + viewing
- [ ] Admin Console (B6)
- [ ] MCP tool integration (B4)
- [ ] Code sandbox (B5)
- [ ] All committed + pushed; `docs/progress.md` updated