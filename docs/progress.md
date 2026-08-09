# Maya Chat — Live Progress

> **Purpose:** This is the single source of truth for what's done, what's in progress, and what's next. If a session is interrupted (token limit, crash), the next session reads THIS file to resume. **Always update this file at the end of every working session.**

---

## Current Status

**Phase:** A — Multi-tenant foundation & B2B SaaS architecture
**Last updated:** Session start (Phase A)

<!-- UPDATE BELOW as you work. Keep this section current. -->

### In Progress
- [ ] Frontend multi-tenant UI (org switcher, team, roles)
- [ ] End-to-end verification

### Completed
- [x] Project recon
- [x] Docs scaffold (this file + agents.md + skills.md + architect.md)
- [x] Design direction locked (taste-skill: minimalist/premium, VARIANCE 5 / MOTION 3 / DENSITY 2)
- [x] **Phase A backend: multi-tenant schema** — organizations, memberships (RBAC owner/admin/member), invitations, schema_migrations, org_id on all resources
- [x] **Phase A auth upgrade** — access + refresh JWT, org context dependency (`X-Org-Id` header / token claim), org CRUD + members + invitations routes
- [x] **Org-scoped API routes** — projects, conversations, memory, skills, files, analytics, WebSocket all scoped to org
- [x] **Dynamic provider registry** — `providers` + `provider_models` tables; base_url + api_key; auto-discover models from `/models` endpoint; capability inference (reasoning, vision, audio, file, multimodal, context window); LLM service routes via DB registry
- [x] **All libraries latest + 0 vulns** — backend (fastapi 0.128, uvicorn 0.39, pydantic 2.13, httpx 0.28, openai 2.48, anthropic 0.121); frontend (React 19.2, Vite 8.2, TS 7.0, router 7.18, Tailwind 4.3). Fixed TS7 type errors, build passes, `npm audit` 0 vulnerabilities.
- [x] **Design system** — white minimalist premium tokens (canvas #FFFFFF, surface #F9F9F8, hairline #EAEAEA, ink #111111, muted #787774, accent #4a6cf7), Geist Variable + Geist Mono fonts, Phosphor icons, `.hairline`/`.lift`/`.reveal` utilities. Legacy warm/cream palette kept for app pages during transition.
- [x] **Enterprise landing page** — mobbin-caliber public site at `/` (nav, hero, product preview mockup, 6 capabilities grid, provider showcase, dark enterprise section, 3-tier pricing, CTA, footer). Agentic messaging throughout. App moved to `/app/*`.
- [x] **Bug fixes (login redirect + broken menus)** — root causes: (1) React Query `useQuery` was used without a `QueryClientProvider` wrapper → every data page crashed/blanked; wrapped in `main.tsx`. (2) API collection routes called without trailing slashes → FastAPI 307-redirects and drops auth headers → 401 → session bounce; added trailing slashes to `client.ts`. (3) WebSocket connected without auth token → closes with "Unauthorized"; now passes `?token=` in `useWebSocket`.
- [x] **Design system applied to all app pages** — Chat, Projects, Memory, Skills, Analytics, Settings, Team, Providers, Layout, ChatInput/Message, CodeBlock, ArtifactRenderer all migrated off the old warm/cream/amber palette + Lucide to the new tokens + Phosphor. Removed `lucide-react` dependency.
- [x] **Maya logo applied** — landing nav/footer, login, register, sidebar, favicon, chat avatar.
- [x] **Docs reorganized** — moved `AGENTS.md`, `ARCHITECT.md`, `SKILLS.md`, `progress.md` into `docs/`. Consolidated duplicate `.claude/skills` + `.codex/skills` into one `skills/` folder. Added `backend/README.md` (setup, config, API reference, multi-tenancy). Updated root `README.md` doc index.

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