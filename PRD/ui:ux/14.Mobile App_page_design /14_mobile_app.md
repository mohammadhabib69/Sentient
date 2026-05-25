# Sentient Mobile — Approval Interface (React Native)
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## App: Sentient Mobile
**Platform**: React Native, 375px wide (iPhone standard)
**Purpose**: Human-in-the-loop — approve/reject agent actions on the go
**Show**: Dark AND light mode for each screen

---

## Screen 1: Approvals Home (main screen)

### Header
- "Sentient" wordmark 18px bold center
- Left: hamburger/menu icon
- Right: bell icon with badge count "7"
- Below header: "AI Workforce · 7 pending" sub-label in primary color

### Pending Approvals Feed
Full-screen scrollable list of approval cards

**Approval Card Structure** (full width, 16px margin sides):
- Background: surface-1
- Border: 1px border
- Radius: 14px
- Left colored border (4px): red=high risk, amber=medium, green=low

Card content:
- Top row: Agent avatar circle (36px) + agent name bold + risk pill right-aligned
- Action type in small monospace badge: "reassign_task"
- Description text: 14px, 2 lines
- Bottom row: ⏰ "Expires in 23m" foreground-3 + approval button row

**Two buttons** (large, thumb-friendly, each 50% width):
- APPROVE ✓ — secondary green bg, white text, 44px height, 10px radius
- REJECT ✗ — red-muted bg, red border, red text, 44px height

**Sample cards** (3 visible, scroll for more):

Card 1 (Low risk, green left border):
- AR Aria avatar · "Aria — Operations" · "LOW RISK" green pill
- "reassign_task" badge
- "Reassign 'Fix login bug' to Sarah Kim (available, 30% load)"
- Expires: "23m" · [APPROVE] [REJECT]

Card 2 (Medium risk, amber border):
- FL Flux avatar · "Flux — Dev" · "MEDIUM RISK" amber pill
- "create_github_issue"
- "Create issue: Repeated 500 errors on /api/tasks (14x in 2h)"
- Expires: "1h" · [APPROVE] [REJECT]

Card 3 (Low risk):
- NV Nova · "Nova — Finance" · "LOW RISK"
- "send_payment_reminder"
- "Remind Meridian Corp: Invoice #INV-2841 ($4,200) 7 days overdue"
- Expires: "2h" · [APPROVE] [REJECT]

### Bottom Tab Bar (glass blur)
- Background: glass blur, 56px height
- 4 tabs: Approvals (active, primary dot) · Notifications · Dashboard · Profile
- Active tab: icon + label in primary color, others in foreground-3

---

## Screen 2: Approval Detail

### Navigation
- "← Back" left + "Approval #284" center title

### Content (scrollable)
- Agent card: large avatar (56px) + "Aria — Operations Agent" + "ACTIVE" pulsing dot
- Action card:
  - "reassign_task" badge large + risk "LOW RISK"
  - Full description (not truncated)
  - Impact: "1 task affected · 2 users notified"
- Payload expandable card (surface-2, monospace):
  ```
  taskId: "task_abc123"
  fromUser: "john@acme.com"
  toUser: "sarah@acme.com"
  reason: "John inactive for 3 days"
  ```
- Expiry countdown: "Expires in 23 minutes"

### CTA Buttons (bottom, full width, large)
- APPROVE ✓ — full width, 56px height, secondary green, 14px radius
- REJECT ✗ — full width, 56px height, red-muted bg, red border
- Both buttons have ample padding, easy thumb press

---

## Screen 3: Notifications

### Header: "Notifications" + "Mark all read" link

### Notification List
Each item:
- Icon circle (24px, colored by type)
- Text: bold title + normal sub-text
- Timestamp right
- Unread: slight primary-muted bg tint

Sample notifications:
- 🤖 "Aria needs approval" · "Reassign task action waiting" · "Just now" · UNREAD
- ⚠️ "Anomaly detected" · "Nova flagged Stripe batch #842" · "2m ago" · UNREAD
- ✅ "Action completed" · "Flux created GitHub issue #284" · "15m ago"
- 👤 "James joined" · "James Doe joined Engineering workspace" · "1h ago"
- 📊 "Weekly digest" · "This week: 142 tasks, 94% health score" · "Yesterday"

---

## Screen 4: Dashboard (Mobile)

### 3 Metric Cards (stacked or 2-col grid)
- Active Tasks: "42"
- Pending Approvals: "7" (amber tint)
- Health: "98.4%"

### Recent Stream Events
3 compact event rows (less detailed than web)
Each: colored dot + event description + timestamp

### Quick Action Buttons
- "View all approvals →" primary button
- "Open on desktop ↗" ghost link

---

## Screen 5: Profile

### User Info
- Large avatar (80px) centered
- Name: "Mohammad Habib"
- Role: "Super Admin"
- Org: "Sentient Engine"

### Settings List (tappable rows with right chevron)
- Notification Settings
- Biometric Authentication (toggle, ON)
- Theme: "Dark" → tap to switch (shows Dark / Light options)
- Language: English
- About Sentient
- Sign Out (red text)

### Theme Row Detail
When "Theme" is tapped → shows two large option cards:
- Dark mode card: dark thumbnail + "Dark" label + checkmark (selected)
- Light mode card: light thumbnail + "Light" label

---

## Light Mode Mobile
- Background: `#F5F7F6`
- Cards: white
- Tab bar: white glass blur
- Same layout, light tokens
- Approval buttons same (semantic colors)

