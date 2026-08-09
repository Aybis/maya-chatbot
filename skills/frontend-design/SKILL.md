---
name: frontend-design
description: Design guidance for Maya Chat UI. Use when building or reshaping any frontend screen. Follows the locked Apple/Mobbin minimalist design system.
---

# Frontend Design — Maya Chat

Maya uses a **locked design system** (white minimalist premium). Follow the
tokens and rules below exactly. Do not introduce new palettes, fonts, icons,
or shadow styles without documenting the change in `docs/architect.md`.

## Design Read
B2B SaaS product UI for technical buyers; premium Apple/Mobbin minimalist;
white monochrome + one desaturated accent. Dials: `VARIANCE 5 / MOTION 3 / DENSITY 2`.

## Design Tokens (canonical — in `src/index.css`)
| Token | Value |
|-------|-------|
| canvas | `#FFFFFF` |
| surface | `#F9F9F8` |
| surface-2 | `#F4F4F3` |
| line | `#EAEAEA` |
| ink (text) | `#111111` |
| ink-2 | `#2F3437` |
| muted | `#787774` |
| muted-2 | `#A1A19E` |
| accent | `#4a6cf7` |
| accent-ink | `#3b5bdb` |
| accent-soft | `#eef1fe` |

## Hard Rules
- **Fonts:** `Geist Variable` (UI) + `Geist Mono` (code/meta). NO Inter/Roboto/Open Sans.
- **Icons:** `@phosphor-icons/react`. NEVER Lucide. One family, consistent stroke.
- **Shadows:** essentially none. No `shadow-md/lg/xl`. Use `.lift` (diffuse <0.05) or `.hairline` borders.
- **Borders:** `1px solid #EAEAEA` (`hairline` utility). Radius 8–12px crisp. No `rounded-full` on cards/buttons.
- **Buttons:** solid `bg-ink` text-canvas, radius 4–6px, no shadow, hover `scale(0.98)`.
- **Motion:** invisible — fade + `translateY(12px)`, 600ms `cubic-bezier(0.16,1,0.3,1)`, via `.reveal`. IntersectionObserver only.
- **No emojis** in UI. Use icon glyphs.
- **Accent discipline:** one accent color per page, used consistently. No purple/neon gradients.

## Utilities
- `.hairline` — 1px border
- `.lift` — ultra-diffuse shadow
- `.reveal` — entrance animation

## Layout
- Macro whitespace (`py-24/28/32` for marketing sections).
- Content `max-w-6xl` (marketing) / `max-w-4xl` (app pages).
- Grid over flex-math. `min-h-[100dvh]` not `h-screen`.
- App shell: 64px sidebar (`w-64`), hairline border, org switcher at top.

## Contrast (a11y)
- Body text ≥ `#787774` on white → passes AA. Muted-2 only for placeholders/decorative.
- Buttons: text/canvas contrast verified. Never white-on-white or transparent CTA with no border.