# Sentient — Analytics Dashboard
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Analytics (`/analytics`)
**Layout**: App shell (glass sidebar + top bar)
**Show**: Dark AND light mode

---

## Page Header
- "Analytics" — 20px bold
- Sub: "Business intelligence — powered by your reality engine" — 13px foreground-2
- Right: time range selector — "7d · 30d · 90d · Custom" tab pills (30d selected in primary)

---

## Top Stats Row (3 wide metric cards)
**Card 1 — Total Agent Actions**
- Value: "3,847" large mono
- Sub: "+18% from last period" green
- Sparkline: tiny line chart trending up

**Card 2 — Tasks Completed**
- Value: "142"
- Sub: "↑ 24 vs last period" green
- Sparkline trending up

**Card 3 — System Uptime**
- Value: "99.8%"
- Sub: "2m downtime this period"
- Sparkline near-flat

---

## Main Charts Grid

### Row 1: Two side-by-side charts

**Chart 1 — Task Completion Velocity (line chart, ~60% width)**
- Card: glass header with "Task Velocity" title + time range tabs (7d/30d)
- X-axis: dates (last 30 days)
- Y-axis: tasks completed per day
- Line: primary color `#74959B`, 2px stroke
- Area fill below line: primary at 15% opacity
- Small dots at each data point
- Anomaly marker: small red dot at day 14 (dip) with tooltip "Nova flagged slowdown"
- Grid lines: very subtle, `rgba(255,255,255,0.05)` dark / `rgba(0,0,0,0.05)` light

**Chart 2 — Agent Action Breakdown (stacked bar, ~40% width)**
- Title: "Agent Activity"
- X-axis: last 7 days
- 4 stacked segments per bar:
  - Aria (teal `#74959B`)
  - Nova (amber `#D4874A`)
  - Echo (green `#49776B`)
  - Flux (blue `#3B82F6`)
- Legend below: colored dots + agent names

---

### Row 2: Two charts

**Chart 3 — Productivity Heatmap (calendar, full width or ~60%)**
- Title: "Team Productivity"
- Calendar grid: last 3 months
- Each day: small square colored by activity level
- Color scale: `#1E201F` (no activity) → `#2C3D33` → `#49776B` → `#74959B` (peak)
- Weekday labels: Mon Tue Wed Thu Fri Sat Sun
- Month labels above each month section
- Legend: "Less" [squares getting brighter] "More"

**Chart 4 — Project Health (donut, ~40% width)**
- Title: "Project Status"
- Donut chart:
  - Active/Healthy: secondary green `#49776B` (~40%)
  - In Progress: primary teal `#74959B` (~30%)
  - Blocked: red `#C0504A` (~15%)
  - Completed: foreground-3 `#5C6B5F` (~15%)
- Center of donut: "4 Projects" bold
- Legend right side: colored dot + label + percentage

---

### Row 3: Anomaly Alerts Panel (full width)
- Title: "AI-Detected Anomalies" + "Nova" agent chip
- 3 alert rows:

Alert 1 (amber, high priority):
- Icon: warning triangle amber
- "Stripe payment processing slowdown — batch #842, 3 transactions flagged"
- "Detected 2h ago · Nova · Finance"
- Right: "View →" link

Alert 2 (amber):
- "Task completion rate dropped 34% in Engineering workspace — possible bottleneck"
- "Detected 6h ago · Aria · Operations"

Alert 3 (green — resolved):
- "✓ API latency spike resolved — P99 back to normal (84ms)"
- "Resolved 1h ago · System"
- Right: "Resolved" green badge

---

## Light Mode
- Charts: same colors (semantic), white card backgrounds
- Grid lines: `rgba(0,0,0,0.06)`
- Heatmap: uses same color scale (starts near white instead of near-black)
- Card headers: light glass

