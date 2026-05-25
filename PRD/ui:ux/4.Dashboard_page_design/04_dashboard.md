# Sentient — Main Dashboard
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Dashboard (`/dashboard`)
**Layout**: App shell — glass sidebar left (floating, 240px), top bar (56px sticky), scrollable content area right
**Show**: Dark mode AND light mode variants

---

## App Shell (applies to ALL app pages)

### Glass Sidebar (left, floating)
- Fixed position, left: 16px, top: 16px
- Height: calc(100vh - 32px)
- Width: 240px
- Background: `rgba(44,61,51,0.45)` + `blur(28px) saturate(180%)`
- Border: `1px solid rgba(116,149,155,0.18)`
- Border radius: 20px
- Shadow: `0 8px 32px rgba(0,0,0,0.40)`
- Top inner highlight: inset 0 1px 0 `rgba(255,255,255,0.05)`

**Sidebar top section**:
- Logo mark (20×20, primary color rounded square) + "Sentient" bold 15px
- Below: "Sentient Engine" in foreground-3, 11px
- "REALITY-1 ALPHA" small badge below in amber

**Workspace switcher** (below logo, 8px gap):
- Shows "S" avatar circle + "Sentient Engine" text + chevron-down
- Background: surface-3, 8px radius, full sidebar width

**Nav items** (middle):
- Dashboard (active — primary bg tint, 3px left primary border)
- Agents
- Reality Stream
- Graph
- Projects
- Analytics
- Settings

Each nav item: icon (16px) + label (14px), 36px height, 8px horizontal padding, 8px radius

**Sidebar bottom**:
- "🚀 Deploy Agent" button — glass capsule, primary border, full width, 36px
- User avatar (24px circle, "S" initials) + "Sentient Engine" name + role "REALITY-1 ALPHA"

### Top Bar
- Height: 56px, sticky
- Background: `rgba(30,32,31,0.80)` + `blur(20px)`
- Border bottom: `1px rgba(46,51,48,1)`
- Left: "MISSION CONTROL" in 10px uppercase foreground-3 · "System Overview" in 20px bold foreground
- Right side row: 🔔 bell icon (notification badge) · ⚡ lightning bolt icon · grid icon · user avatar circle
- Theme toggle: moon/sun icon button before the avatar

---

## Dashboard Content Area (main)

### Page Title Row
- "MISSION CONTROL" label — 10px uppercase foreground-3, letter-spacing
- "System Overview" — 20px bold foreground
- Right side: "● System Normal" green pill + "⏰ Live Update" amber pill

### Metric Cards Row (4 cards, equal width)

**Card 1 — Active Tasks**
- Value: **42** (large, monospace)
- Label: "ACTIVE TASKS"
- Subtext: "↑ 12% vs last week" in green 12px
- Icon: checkmark square in top-right corner area, foreground-3

**Card 2 — Pending Approvals** (amber tint when value > 0)
- Value: **7**
- Label: "PENDING APPROVALS"
- Subtext: "● Requires Action" in amber with amber dot
- Icon: clock icon

**Card 3 — Agent Actions Today**
- Value: **128**
- Label: "AGENT ACTIONS TODAY"
- Progress bar below value: 80% filled in secondary green
- Subtext: "Stable" in foreground-2

**Card 4 — System Health Score**
- Value: **98.4%** in large mono
- Label: "SYSTEM HEALTH SCORE"
- 4-segment color bar below: green/teal/amber/primary segments, mostly filled
- Icon: target/shield icon

Card style: surface-1 bg, 1px border, 14px radius, 16px padding

---

### Main Grid Row (below metrics)

**Reality Stream panel (left, ~60% width)**
- Card header: "Reality Stream" title + filter icon top-right + "4 ACTIVE" badge
- Shows 3 recent events as cards:

Event 1 (teal left border):
- Avatar: "FL" teal circle
- "Flux (Dev)" bold + "SUGGESTION" amber badge
- Text: "Suggests PR priority escalation on **sentient-core** due to dependency bottleneck."
- Timestamp: "Just now"

Event 2 (amber left border):
- Avatar: "NV" amber circle
- "Nova (Finance)" + "ANOMALY" red badge
- Text: "Detected anomaly in Stripe subscription processing batch **#842**. 3 transactions flagged."
- Timestamp: "2m ago"

Event 3 (muted border):
- Avatar: user icon, no color
- "User (Mohammad)" + "APPROVAL" muted badge
- Text: "Approved manual override for agent action **#102**. Deployment..."
- Timestamp: "15m ago"

**Fleet Status panel (right, ~40% width)**
- Header: "Fleet Status" + "4 ACTIVE" badge
- 2×2 grid of agent mini-cards:

Aria (AR, teal avatar):
- "Aria" bold · "OPERATIONS" small uppercase foreground-3
- Green active dot top-right
- "⏰ Last: 12s ago"

Nova (NV, amber avatar):
- "Nova" · "FINANCE"
- Amber dot (slightly less active)
- "⏰ Last: 2m ago"

Echo (EC, green avatar):
- "Echo" · "COMMUNICATIONS"
- Green dot
- "⏰ Last: 45s ago"

Flux (FL, blue avatar):
- "Flux" · "DEVELOPMENT"
- Green dot (most active)
- "⏰ Last: Just now"

---

### Bottom Grid Row

**Active Projects table (left, ~55% width)**
- Header: "Active Projects" + "View All →" link
- Table header: PROJECT NAME · STATUS · LEAD AGENT · HEALTH
- Row 1: "Core Refactor Q3" | "IN PROGRESS" green badge | FL Flux avatar chip | "94%"
- Row 2: "Stripe API Migration" | "BLOCKED" red badge | NV Nova chip | "62%"
- Row 3: "Q4 Marketing Cam..." | (cut off, fades) | ...

**Topology panel (right, ~45% width)**
- Header: "Topology" + zoom+/zoom- icons
- Dark canvas (`#1A201D`) showing a mini business graph
- Nodes: labeled circles — "API", "CORE", "UI", "DB" — connected by lines
- CORE node is slightly larger and more prominent
- Nodes glow in primary/secondary colors
- Non-interactive visual only

---

### Command Input Bar (bottom, full width)
- Floating glass input bar
- Background: glass style, full width, 52px height, 12px radius
- Left: sparkle/rocket icon in primary color
- Placeholder text: "Issue a command to Sentient..."
- Right: "EXECUTE ↗" button in surface-2

---

## Light Mode
- Sidebar: `rgba(255,255,255,0.60)` + blur(28px) + light border
- Background: `#F5F7F6`
- Cards: white with light border
- Top bar: light bg + blur
- All text darkened per light mode token values

