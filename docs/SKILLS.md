# SKILLS.md — Maya Chat

> Index of reusable skills and design knowledge for this project. Load the relevant skill before building.

## Project Skills (single consolidated `skills/` folder)
| Skill | Use for |
|-------|---------|
| `skills/maya-chat-setup/` | Onboarding + dev environment setup + critical PYTHONPATH constraint + multi-tenant overview |
| `skills/maya-chat-feature/` | Adding new backend/frontend features (multi-tenant rules, providers, design system) |
| `skills/frontend-design/` | The locked white minimalist premium design system (tokens, rules, a11y) |

These skills are the canonical, project-specific source of truth. Refer to them
instead of the generic framework skills below.

## Design Knowledge (from taste-skill repo)
Cloned to `/tmp/taste-skill` during Phase A. The canonical design guidance is
the locked system in `skills/frontend-design/` + `docs/ARCHITECT.md → Design Direction`.

| Reference | Use for |
|-----------|---------|
| `skills/minimalist-skill/SKILL.md` | Original inspiration — clean, editorial, premium minimalist UI |
| `skills/taste-skill/SKILL.md` | Design read, dials (VARIANCE/MOTION/DENSITY), anti-slop rules |
| `skills/brutalist-skill/SKILL.md` | Do NOT use — wrong aesthetic for this project |

## Key Rules Extracted (must-follow)
1. **Fonts:** Geist Variable (UI) / Geist Mono (code). NO Inter/Roboto/Open Sans.
2. **Icons:** Phosphor (`@phosphor-icons/react`). NEVER Lucide. One family, one stroke.
3. **Colors:** canvas `#FFFFFF`, surface `#F9F9F8`, line `#EAEAEA`, ink `#111111`, muted `#787774`, ONE accent `#4a6cf7`.
4. **Shadows:** essentially none. No `shadow-md/lg/xl`. Hairline borders + `.lift`.
5. **Radius:** 8–12px crisp. No `rounded-full` on cards/buttons.
6. **No emojis** in UI. Use icon glyphs.
7. **Motion:** invisible — fade + translateY(12px), 600ms `cubic-bezier(0.16,1,0.3,1)`, IntersectionObserver.
8. **Buttons:** solid `bg-ink` / white text, radius 4–6px, no shadow, hover `scale(0.98)`.

## Hermes/Agent Skills relevant to this project
- `hermes-agent` — running/configuring Hermes itself (not this app).
- `claude-code` / `codex` / `opencode` — delegating coding subagents.
- `react-dashboard-development` — React dashboard patterns (sidebar nav, summary landing).

## LLM Provider Skills (for the app's LLM routing layer)
- `llama-cpp`, `serving-llms-vllm` — local inference options.
- `huggingface-hub` — model discovery.