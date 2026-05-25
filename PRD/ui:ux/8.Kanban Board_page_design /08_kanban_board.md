# Sentient — Kanban Board
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Kanban Board (`/projects/[id]/board`)
**Layout**: App shell (glass sidebar + top bar). FULL BLEED content — no page padding.
**Show**: Dark AND light mode

---

## Sub-Navigation (below top bar)
- Breadcrumb: "Projects → Core Refactor Q3"
- Tab bar: "Overview" · "Board" (active) · "Timeline" · "Members"
- Right side: "Ask AI 🤖" ghost button + "Add Task +" primary button + filter/group icons

---

## Board Layout
Horizontal scroll, 5 columns side by side:
- Each column: 280px wide, full height, slight gap between columns
- Board background: app background (no card around entire board)

### Column Structure
Each column has:
- **Column header** (row):
  - Status indicator dot (colored)
  - Column name bold 14px
  - Task count badge: small surface-2 pill with number
  - "+" add task icon button (ghost, right side)
- **Drop zone**: `rgba(37,40,39,0.60)` background, 12px radius, min-height to fill visible area
- **Task cards** stacked with 8px gap
- **"Add a task"** ghost row at bottom of each column

### Column Colors:
- Todo: muted/gray dot
- In Progress: primary/teal dot
- Review: amber dot
- Done: secondary/green dot
- Blocked: red dot + column has `2px solid rgba(192,80,74,0.30)` top border + very slight red-muted bg

---

## Task Cards

### Standard Task Card
- Background: surface-1 (`#252827`)
- Border: `1px #2E3330`
- Border radius: 10px
- Padding: 12px
- Left side: 3px colored micro-border by priority (red=critical, amber=high, teal=medium, muted=low)

**Card Content**:
- Row 1: Priority badge (small, colored) + optional label chip (e.g. "Backend", "Auth")
- Title: 14px foreground, max 2 lines
- Row 3 (bottom): Assignee avatar (24px circle) + due date (if exists) right-aligned + subtask count if >0

**Sample cards in each column**:

Todo:
- "Set up Redis caching layer" · HIGH · MH avatar · "Jun 15"
- "Write API documentation" · MEDIUM · unassigned
- "Add rate limiting middleware" · LOW

In Progress:
- "Core Refactor Q3" · CRITICAL · SA avatar · "Jun 10" · 3/8 subtasks
- "JWT refresh token rotation" · HIGH · JD avatar

Review:
- "Database schema migration" · MEDIUM · SA avatar · "Jun 8"

Done:
- "Set up Turborepo monorepo" · MEDIUM · MH avatar
- "Docker compose configuration" · LOW · JD avatar
- "Deploy staging environment" · HIGH · MH avatar ✓

Blocked (red-tinted column):
- "Stripe API Migration" · CRITICAL · NV Nova chip + "Agent assigned" indicator · "Jun 5"

---

### Dragging State
Show one card in dragging state:
- Background: glass style `rgba(44,61,51,0.80)` + `blur(8px)`
- Scale: slightly larger (102%)
- Shadow: `0 16px 40px rgba(0,0,0,0.50)`
- Rotation: 2 degrees
- The column it's dragged over: highlighted with primary color border and primary-muted background

---

### AI-Assigned Task
One task card shows AI assignment indicator:
- Small agent avatar chip bottom-left: "🤖 Aria" — tiny, 20px, teal
- Slightly different card: teal left micro-border

---

## Task Detail Panel (side panel, appears on card click)
Slides in from right, 420px wide:
- Background: surface-2 glass style
- Top: close (X) button · task title editable · status select dropdown · priority select
- Tabs: Details · Comments · Activity
- Details: assignee picker, due date picker, labels, description rich text area
- Agent section: which agent is monitoring this task + last agent action
- File attachments: drag-drop zone + attached file list
- Activity: mini timeline of events for this task

---

## Light Mode
- Column drop zones: `rgba(240,244,242,0.80)`
- Cards: white with `1px #DDE6E0`
- Blocked column: light red tint `rgba(192,80,74,0.05)`
- Dragging: white glass with light shadow
- Detail panel: white

