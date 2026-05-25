# Sentient — Projects List & Project Overview
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page 1: Projects List (`/projects`)
**Layout**: App shell
**Show**: Dark AND light mode

---

## Page Header
- "Projects" — 20px bold
- Sub: "2 workspaces · 4 active projects"
- Right: view toggle (grid/list icons) + "New Project +" primary button

---

## Workspace Sections
Projects grouped by workspace with a section label:

### Workspace: Engineering
Section label: "⚙ ENGINEERING" 11px uppercase foreground-3 + "2 projects" count

**Project Cards** (grid, 2-3 per row):

Card 1 — "Core Refactor Q3":
- Top: colored accent bar (3px, secondary green)
- Status badge: "IN PROGRESS" primary
- Title: "Core Refactor Q3" 16px bold
- Description: "Refactor the core architecture to support new agent modules" 13px foreground-2, 2 lines
- Stats row: "8 tasks" · "3 members" (avatar stack — 3 overlapping 24px circles) · "Due Jun 30"
- Lead agent chip: "FL Flux" small chip
- Health: "94%" green text
- Bottom: progress bar (60% filled, secondary green)

Card 2 — "Stripe API Migration":
- Accent bar: red (blocked)
- Status: "BLOCKED" red badge
- Title: "Stripe API Migration"
- Description: "Migrate payment processing to Stripe v3 API"
- "6 tasks" · 2 members · "Due Jun 15" (overdue — red text)
- Lead: "NV Nova"
- Health: "62%" amber

### Workspace: Marketing
Section label: "📣 MARKETING" + "2 projects"

Card 3 — "Q4 Campaign":
- Status: "ACTIVE"
- Lead: "EC Echo"
- Health: "88%"

Card 4 — "Brand Refresh":
- Status: "PAUSED" muted badge
- No lead agent
- Health: "—"

---

## Empty State (when no projects)
Centered in content area:
- FolderKanban icon (48px, foreground-3)
- "No projects yet"
- "Create your first project to get started"
- "Create Project →" primary button

---

## New Project Modal
Glass card, 520px:
- "Create Project"
- Workspace select dropdown
- Project name input
- Description textarea (optional)
- Priority select: Low / Medium / High / Critical
- Due date picker (optional)
- Lead agent select: None / Aria / Nova / Echo / Flux
- "Create Project" primary + "Cancel" ghost

---

## Page 2: Project Overview (`/projects/[id]`)

### Sub-Navigation
Breadcrumb: "Projects → Core Refactor Q3"
Tabs: "Overview" (active) · "Board" · "Timeline" · "Members"

### Overview Content

**Top stats row** (4 cards):
- Total Tasks: 8
- Completed: 5 (62%)
- Blocked: 1
- Due in: "12 days"

**Two columns**:

Left (60%):
- Recent Activity card: mini timeline of last 5 task events
- Task Status Distribution: horizontal stacked bar — Todo/InProgress/Review/Done/Blocked

Right (40%):
- Project Health card: large percentage "94%" in secondary green, with context "Agent Flux monitoring"
- Team Members: avatar list with names and roles
- Lead Agent card: "Flux — Development Agent" card with pulsing dot

**Quick Actions** (bottom row):
- "Open Board →" primary button
- "View on Graph →" ghost
- "Export Report" ghost

---

## Light Mode
- Section labels on light bg
- Project cards: white
- Progress bars same colors (semantic)
- Blocked card has very slight red tint bg

