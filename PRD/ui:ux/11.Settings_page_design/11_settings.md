# Sentient — Settings Pages
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Settings Section (`/settings/*`)
**Layout**: App shell (glass sidebar + top bar) + settings sub-navigation
**Show**: Dark AND light mode

---

## Settings Layout
- Left: vertical settings sub-nav (200px, list of links)
- Right: settings content area (fills remaining width)

### Settings Sub-Nav
Glass card or just a list with active state:
- Organization (active example)
- Team Members
- Billing & Plan
- Integrations
- Security
- Profile

Each item: 14px, 36px height, 8px radius, primary color when active

---

## Page 1: Organization Settings (`/settings`)

### Section: Organization Info
- Card with "Organization Info" heading
- Avatar upload: large circle (80px) with "SC" initials + camera overlay on hover + "Change" button
- Form fields:
  - Organization name: "Sentient Corp" pre-filled
  - Slug: "sentient-corp" (readonly-ish, edit icon)
  - Industry: dropdown showing "Technology"
  - Team size: "11-50"
- "Save Changes" primary button

### Section: Danger Zone
- Card with red border `1px rgba(192,80,74,0.30)`, red-muted bg
- Title: "Danger Zone" in red
- Two actions:
  - "Transfer Ownership" — "Transfer this organization to another member" · "Transfer" danger ghost button
  - "Delete Organization" — "Permanently delete this org and all data" · "Delete" danger button (red bg)

---

## Page 2: Team Members (`/settings/team`)

### Header
- "Team Members" heading
- Right: "Invite Member +" primary button

### Members Table
Columns: MEMBER · ROLE · JOINED · LAST ACTIVE · ACTIONS

Rows:
1. MH avatar · "Mohammad Habib" bold · "you" chip · "Super Admin" badge (primary) · "Jan 2026" · "2m ago" · (no actions, it's you)
2. SA avatar · "Sarah Kim" · "Org Admin" badge · "Feb 2026" · "1h ago" · "Change role ▾" + "Remove" red ghost
3. JD avatar · "James Doe" · "Manager" badge · "Mar 2026" · "3d ago" · same actions
4. user icon · "alex@acme.com" · "Pending invite" amber badge · "—" · "5d ago" · "Resend" + "Cancel"

### Invite Modal (overlay):
- "Invite to Sentient Engine"
- Email input (multiple, comma-separated)
- Role select: Org Admin / Manager / Member / Guest
- "Send Invites" primary button

---

## Page 3: Billing (`/settings/billing`)

### Current Plan Card
- Top: "Pro Plan" badge in primary + "Active" green dot
- Plan details: "$49/month · Renews Jun 1, 2026"
- Usage meters:
  - Agents: "2 / 4 active" progress bar 50%
  - Actions this month: "4,820 / 10,000" progress bar 48%
  - Workspaces: "2 / 5" progress bar 40%
- "Upgrade Plan" primary button + "Manage Billing ↗" ghost button

### Payment Method
- Card row: Visa icon + "•••• •••• •••• 4242" + "Expires 12/27" + "Edit" link

### Invoices Table
Columns: DATE · DESCRIPTION · AMOUNT · STATUS · DOWNLOAD
3 rows: last 3 months, all "Paid" green badges, PDF download icon

### Plan Comparison (collapsed by default, "Compare plans ▾" toggle)
Simple 4-column table showing Free/Pro/Business/Enterprise features

---

## Page 4: Integrations (`/settings/integrations`)

### Integration Cards Grid (2 columns)

Each integration card:
- Left: service logo (48px)
- Middle: service name bold + description 13px foreground-2
- Right: "Connected" green badge + "Disconnect" ghost link OR "Connect" secondary button

Cards:
1. GitHub logo · "GitHub" · "Sync repos, PRs, and issues with Flux agent" · CONNECTED · Disconnect
2. Slack logo · "Slack" · "Receive agent notifications in your channels" · CONNECTED
3. Stripe logo · "Stripe" · "Payment data flows to Nova agent automatically" · CONNECTED
4. Google Calendar · "Google Calendar" · "Sync deadlines and meetings" · Connect button
5. Notion · "Notion" · "Sync pages and databases" · Connect button
6. Linear · "Linear" · "Issue tracking integration" · Connect button

---

## Page 5: Security (`/settings/security`)

### Two-Factor Authentication
- Status: "Not enabled" amber badge
- Description: "Add an extra layer of security to your account"
- "Enable 2FA" primary button
- Show: authenticator app and SMS options

### Active Sessions
- Table: DEVICE · LOCATION · LAST ACTIVE · ACTIONS
- Row 1: "Chrome on macOS · Current session" + green "Active" dot · "Dhaka, BD" · "Now" · (current, no action)
- Row 2: "Mobile App · iPhone" · "Dhaka, BD" · "2h ago" · "Revoke" ghost button
- "Revoke All Other Sessions" danger ghost button bottom

### Audit Log (last 5 entries)
Compact table: timestamp + action + IP
- "Agent Aria activated" · "Login from new device" · "API key created" etc.
- "View full audit log →" link

---

## Page 6: Profile (`/settings/profile`)

### Profile Info Card
- Large avatar (80px) + upload button
- Full name input
- Email (readonly, verified badge)
- Job title input: "Founder & CEO"
- Timezone select: "Asia/Dhaka (UTC+6)"
- "Save Changes" button

### Appearance Section
- Title: "Appearance"
- **Theme toggle — most prominent element**:
  - Two large option cards side by side:
    - Left card: dark preview thumbnail + "Dark" label + radio/check when selected
    - Right card: light preview thumbnail + "Light" label + radio when selected
  - Currently selected card has primary border glow
  - Note: "Your preference is saved automatically"

### Notification Preferences
- Toggle rows:
  - "Email me when agents need approval" — ON
  - "Email me weekly activity digest" — ON
  - "Push notifications on mobile" — ON
  - "Notify me on anomaly detection" — OFF

---

## Light Mode Notes
- Settings sub-nav: white/light card
- All cards: white with light border
- Danger zone: same red tint but lighter
- Tables: alternating `#F5F7F6` rows

