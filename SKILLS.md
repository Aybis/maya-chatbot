# SKILLS.md — Maya Chat

> Index of reusable skills and design knowledge for this project. Load the relevant skill before building.

## Design Skills (from taste-skill repo)
Cloned to `/tmp/taste-skill`. The canonical design guidance for this project lives in **progress.md → Design Direction**.

| Skill | Use for |
|-------|---------|
| `skills/minimalist-skill/SKILL.md` | **Primary.** Clean, editorial, premium minimalist UI. White monochrome + muted pastels. |
| `skills/taste-skill/SKILL.md` | Design read, dials (VARIANCE/MOTION/DENSITY), anti-slop rules, layout discipline. |
| `skills/redesign-skill/SKILL.md` | When refactoring existing pages/screens. |
| `skills/soft-skill/SKILL.md` | Alternative softer aesthetic (if ever needed). |
| `skills/brutalist-skill/SKILL.md` | Do NOT use — wrong aesthetic for this project. |

## Key Rules Extracted (must-follow)
1. **Fonts:** Geist Sans / SF Pro Display for UI; Geist Mono / SF Mono for code. NO Inter/Roboto/Open Sans.
2. **Icons:** Phosphor (Bold/Fill) or Radix UI. NEVER Lucide. One family, one stroke weight.
3. **Colors:** White `#FFFFFF` canvas, cards `#F9F9F8`, borders `1px solid #EAEAEA`, off-black text `#111111`, ONE desaturated accent.
4. **Shadows:** essentially none. No `shadow-md/lg/xl`.
5. **Radius:** 8–12px crisp. No `rounded-full` on cards/buttons.
6. **No emojis** in code/UI. Use icon glyphs.
7. **Motion:** invisible — fade + translateY(12px), 600ms `cubic-bezier(0.16,1,0.3,1)`, IntersectionObserver.
8. **Buttons:** solid `#111111` bg / white text, radius 4–6px, no shadow, hover `scale(0.98)`.

## Hermes/Agent Skills relevant to this project
- `hermes-agent` — running/configuring Hermes itself (not this app).
- `claude-code` / `codex` / `opencode` — delegating coding subagents.
- `react-dashboard-development` — React dashboard patterns (sidebar nav, summary landing).

## LLM Provider Skills (for the app's LLM routing layer)
- `llama-cpp`, `serving-llms-vllm` — local inference options.
- `huggingface-hub` — model discovery.