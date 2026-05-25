# Sentient — Design System Reference
> Include this context in EVERY Stitch prompt. Copy-paste at the top of each page prompt.

---

## Project
**Sentient** — AI-Native Business Reality Engine. A SaaS platform where autonomous AI agents observe, decide, and act on behalf of a business. The UI feels like a mission control center — dense with live information, intelligent, and alive.

---

## Color Palette

### Dark Mode (default)
| Token | Value | Usage |
|---|---|---|
| Background | `#1E201F` | App base — deepest layer |
| Surface 1 | `#252827` | Card backgrounds |
| Surface 2 | `#2E3330` | Elevated cards, modals |
| Surface 3 | `#374039` | Hover states |
| Foreground | `#E8EDE9` | Primary text |
| Foreground 2 | `#9BA89D` | Secondary text |
| Foreground 3 | `#5C6B5F` | Placeholders, disabled |
| Primary | `#74959B` | Mist Teal — primary actions, links, active states |
| Secondary | `#49776B` | Forest Green — success, agent active |
| Tertiary | `#2C3D33` | Deep Forest — surface tints |
| Glass Fill | `rgba(44,61,51,0.45)` | Sidebar, floating panels |
| Glass Border | `rgba(116,149,155,0.18)` | Glass edges |
| Amber | `#D4874A` | Warning, pending, attention |
| Red | `#C0504A` | Error, blocked |
| Border | `#2E3330` | Default borders |

### Light Mode
| Token | Value | Usage |
|---|---|---|
| Background | `#F5F7F6` | Warm off-white |
| Surface 1 | `#FFFFFF` | Cards |
| Surface 2 | `#F0F4F2` | Elevated |
| Foreground | `#1E201F` | Primary text |
| Foreground 2 | `#4A5E52` | Secondary |
| Primary | `#4D7A80` | Darker teal for contrast |
| Secondary | `#3D6B5F` | Darker green |
| Border | `#DDE6E0` | Light borders |
| Glass Fill | `rgba(255,255,255,0.65)` | Glass panels |

---

## Typography
- **UI Font**: Geist Sans (fallback: Inter)
- **Mono Font**: JetBrains Mono (for numbers, IDs, metrics, code)
- Scale: 10px micro · 11px xs · 13px sm · 14px base · 15px md · 18px lg · 24px xl · 32px 2xl · 72px hero

---

## Key Visual Rules
1. **Dark is default**. Every page has a dark mode and light mode variant.
2. **Glass sidebar** floats — not attached to edges. 16px gap from left and top/bottom. `blur(28px)`, rounded 20px corners, translucent forest green tint.
3. **No generic blues or purples** — palette is forest/mist/stone only.
4. **Three depth layers**: Background (void) → Surface cards → Glass floating panels.
5. **Everything breathes**: agent dots pulse, stream events flow in, graphs shift.
6. **Light mode is NOT inverted dark** — it uses warm off-white with darker versions of primary/secondary for contrast.

---

## Component Quick Reference

### Cards
- Default: `#252827` bg, `1px #2E3330` border, `14px` radius
- Glass: `rgba(44,61,51,0.45)` + `blur(16px)` + `1px rgba(116,149,155,0.18)` border
- Agent card: teal tint border `rgba(116,149,155,0.20)`
- Warning: amber tint `rgba(212,135,74,0.08)` bg

### Buttons
- Primary: `#49776B` bg, white text, `10px` radius
- Secondary: `rgba(116,149,155,0.10)` bg, primary border
- Ghost: transparent, no border, foreground-2 text
- Danger: `rgba(192,80,74,0.12)` bg, red border

### Badges
- Active/Done: `rgba(73,119,107,0.15)` bg, `#49776B` text
- Pending: `rgba(212,135,74,0.15)` bg, `#D4874A` text
- Blocked/Error: `rgba(192,80,74,0.15)` bg, `#C0504A` text
- Info: `rgba(116,149,155,0.15)` bg, `#74959B` text

### Status Badge Sizes
Font: 11px, weight 500, uppercase, letter-spacing 0.05em, border-radius 6px

---

## Glass Sidebar Spec
- Position: fixed, left 16px, top 16px
- Height: calc(100vh - 32px)
- Width: 240px expanded / 72px collapsed
- Background: `rgba(44,61,51,0.45)` with `blur(28px) saturate(180%)`
- Border: `1px solid rgba(116,149,155,0.18)`
- Border radius: 20px
- Shadow: `0 8px 32px rgba(0,0,0,0.40)`
- Nav items: Dashboard, Agents (+ amber dot badge), Reality Stream, Graph, Projects, Analytics, Developers, Settings
- Bottom: user avatar + "Deploy Agent" button

## Top Bar Spec
- Height: 56px, sticky
- Background: app bg at 80% opacity + blur(20px)
- Border bottom: 1px border color
- Left: breadcrumb
- Center: search pill (glass style, ⌘K hint)
- Right: notifications bell, theme toggle (sun/moon icon), user avatar

---

## Theme Toggle
- Always visible in top bar (right side)
- Moon icon → dark mode active
- Sun icon → light mode active
- Clicking toggles between dark and light
- Show both states in every design

