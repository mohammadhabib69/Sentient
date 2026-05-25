# Sentient — Reality Stream
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Reality Stream (`/stream`)
**Layout**: App shell (glass sidebar + top bar)
**Show**: Dark AND light mode

---

## Page Header
- "Reality Stream" — 20px bold
- Sub: "Every action, every decision — immutable and live" — 13px foreground-2
- Right: live indicator — pulsing green dot + "LIVE" text in secondary color

---

## Two-Panel Layout

### Left Panel — Filters (260px wide, fixed)
Glass card style, full height of content area

**Panel title**: "FILTERS" 11px uppercase foreground-3

**Event Type** (multi-select chips):
- Chips: "All" (selected, primary bg) · "Agent Actions" · "User Actions" · "Anomalies" · "System" · "Errors"
- Chips: 11px, 6px radius, toggle on/off

**Actor** dropdown:
- Label: "Actor"
- Options: All Actors / Aria / Nova / Echo / Flux / Users only / System only

**Aggregate Type** dropdown:
- Label: "Entity Type"
- Options: All / Tasks / Projects / Agents / Billing / System

**Date Range**:
- Label: "Time Range"
- Preset buttons: "1h" · "24h" · "7d" · "30d" (one selected, primary bg)

**Clear Filters** ghost button bottom of panel

---

### Right Panel — Event Timeline (fills remaining width)
Vertical timeline, newest events at top

**Timeline header row**: "128 events" count · "↓ Newest first" sort · "⚙ Columns" icon

**Event Card Structure** (repeating):
Each event is a card with a colored left border (4px):
- Teal border = Agent action
- Amber border = Anomaly / warning
- Muted/gray border = User action
- Red border = Error

**Event Card Fields**:
- Row 1: Actor avatar (24px circle with initials) · Actor name bold · Event type badge (small, monospace font) · Timestamp right-aligned
- Row 2: Event description (14px, foreground, max 2 lines)
- Row 3: Entity chip (e.g., "task: Fix login bug") + "↗ View" ghost link

**Sample Events** (show 7-8):

1. [Teal] FL Avatar · "Flux (Dev)" · SUGGESTION badge · "Just now"
   "Suggests PR priority escalation on **sentient-core** due to dependency bottleneck."
   Entity: "project: sentient-core"

2. [Amber] NV Avatar · "Nova (Finance)" · ANOMALY badge · "2m ago"
   "Detected anomaly in Stripe subscription processing batch **#842**. 3 transactions flagged for review."
   Entity: "billing: batch-842"

3. [Muted] User icon · "Mohammad (Admin)" · APPROVAL badge · "15m ago"
   "Approved manual override for agent action **#102**. Deployment proceeded."
   Entity: "action: #102"

4. [Teal] AR Avatar · "Aria (Ops)" · ACTION badge · "18m ago"
   "Reassigned task 'API Migration' from John (inactive 3d) to Sarah (available, 30% load)"
   Entity: "task: API Migration"

5. [Muted] User icon · "James (Dev)" · UPDATE badge · "32m ago"
   "Updated task status: 'Deploy staging' from In Progress → Done"
   Entity: "task: Deploy staging"

6. [Red] System icon · "System" · ERROR badge · "1h ago"
   "Agent Echo failed to connect to CRM API endpoint. Retry attempt 3/3 failed."
   Entity: "agent: Echo"

7. [Teal] FL Avatar · "Flux (Dev)" · ACTION badge · "1h 15m ago"
   "Created GitHub issue #284: 'Repeated 500 errors on /api/tasks'"
   Entity: "github: issue-284"

8. [Amber] NV Avatar · "Nova (Finance)" · ALERT badge · "2h ago"
   "Payment from Horizon Corp is 7 days overdue. Invoice #INV-2841 ($4,200)"
   Entity: "billing: INV-2841"

**Each card**: surface-1 bg, 1px border, 10px radius, 12px padding. Hover: border brightens slightly.

---

## Event Detail Panel (when clicking an event)
Slides in from right, 420px wide, glass panel:
- Top: event type large badge + timestamp
- Actor section: avatar + name + role
- Event description full
- Payload section (collapsible): JSON-like data in monospace, surface-2 bg
- Related entity: link to the task/project/agent
- Close button (X) top-right

---

## Light Mode
- Sidebar light glass
- Cards white
- Left borders same colors (they're semantic, not theme-dependent)
- Filter panel: white card
- Timeline bg: light app bg

