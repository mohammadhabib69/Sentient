# Sentient — Business Graph
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Business Graph (`/graph`)
**Layout**: App shell (glass sidebar + top bar). Content is FULL BLEED — no padding around graph.
**Show**: Dark AND light mode

---

## Graph Canvas (fills entire content area)
- Background: `#1A201D` (dark) / `#EBF0EC` (light) — slightly different from app bg
- No padding — graph fills edge to edge below top bar

---

## Floating Toolbar (top-right of canvas)
Glass panel, floating on top of graph, not embedded:
- Background: glass style `rgba(44,61,51,0.85)` + blur(20px)
- Border: 1px glass border
- Border radius: 12px
- Padding: 8px
- Items (icon buttons with tooltips): 🔍+ Zoom In · 🔍- Zoom Out · ⊡ Fit to screen · Filter by type · ★ Highlight bottlenecks · ↗ Highlight critical path · ↓ Export

---

## Graph Content (nodes and edges)

### Node Types and Visual Style
All nodes: circle shape, colored, white label text inside or below

**User nodes** (small, ~40px):
- Fill: `rgba(116,149,155,0.80)` (primary)
- Border: `2px #74959B`
- Label: user initials or short name
- Example nodes: "MH" (Mohammad), "SA" (Sarah), "JD" (James)

**Project nodes** (medium, ~56px):
- Fill: `rgba(73,119,107,0.80)` (secondary)
- Border: `2px #49776B`
- Example: "CORE", "STRIPE", "MKTG"

**Task nodes** (small, ~32px):
- Fill: `rgba(212,135,74,0.70)` (amber)
- Border: `2px #D4874A`
- Example: "T1", "T2", "T3"

**Agent nodes** (medium, ~48px, distinctive):
- Fill: `rgba(232,237,233,0.15)` (near white, ghost-like)
- Border: `2px #E8EDE9` dashed
- Label: "Aria", "Nova", "Flux"
- Small pulsing dot indicator showing active status

### Edges
- Default: 1px `rgba(116,149,155,0.25)` lines
- Hover: brighter, 2px
- DEPENDS_ON relationship: dashed line
- Critical path: 2px animated dashed line in primary color (flowing dashes)
- MONITORED_BY (agent → project): 1px dashed secondary color

### Bottleneck Nodes
- Nodes with many blocked dependencies: red glow effect (`box-shadow: 0 0 16px #C0504A`)
- Slightly larger than normal
- Small red "!" indicator

### Layout of Sample Graph
Show ~15 nodes total:
- 3 User nodes scattered (MH, SA, JD)
- 3 Agent nodes at edges (Aria top-right, Flux top-left, Nova bottom)
- 4 Project nodes in center cluster (CORE, API, UI, DB)
- 5-6 Task nodes connected to projects
- CORE project is central, larger, most connections
- Multiple edges radiating from CORE (it's the "bottleneck" — add red glow)

---

## Node Detail Panel (when clicking a node)
Slides in from right, 380px wide, glass panel

**For a Project node clicked (e.g. "CORE"):**
- Top: "Project" label + node color indicator
- Name: "Core Refactor Q3" large bold
- Status badge: "IN PROGRESS"
- Stats row: "8 Tasks" · "3 Members" · "Health: 94%"
- Lead Agent: Flux chip
- Tabs: Details · Tasks · Members · Events
- Details tab: description, due date, priority, workspace

---

## Mini Legend (bottom-left corner of canvas)
Small glass card:
- Title: "Legend"
- Row: primary dot + "Users"
- Row: secondary dot + "Projects"
- Row: amber dot + "Tasks"
- Row: white ghost dot + "Agents"
- Row: red glow icon + "Bottleneck"

---

## Light Mode
- Canvas: `#EBF0EC` background
- Nodes: same colors but at full opacity
- Edges: darker for visibility
- Glass panels: white with light border
- Toolbar: white glass

