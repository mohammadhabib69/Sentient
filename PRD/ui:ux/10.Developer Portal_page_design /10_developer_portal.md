# Sentient — Developer Portal
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Developer Portal (`/developers`)
**Layout**: App shell (glass sidebar + top bar)
**Show**: Dark AND light mode

---

## Page Header
- "Developer Portal" — 20px bold
- Sub: "Build on Sentient — API, webhooks, and marketplace" — foreground-2
- Right: "View API Docs ↗" ghost button

---

## Sub-Navigation Tabs
Horizontal tab bar: "Overview" (active) · "API Keys" · "Webhooks" · "Marketplace"

---

## Overview Tab Content

### Stats Row (3 cards)
- "API Calls Today": 1,247 · "+12% vs yesterday"
- "Active Webhooks": 4
- "Installed Plugins": 3

### API Quick Start Card
Full-width glass card:
- Title: "Quick Start" + copy icon
- Code block (monospace, surface-2 bg, left border primary):
```
POST https://api.sentient.app/v1/tasks
Authorization: Bearer sk_live_••••••••••••4f2a

{
  "title": "Review Q3 roadmap",
  "projectId": "proj_abc123",
  "priority": "high"
}
```
- Response preview below (collapsed by default, expand arrow)
- "View Full Docs →" link

### Recent API Activity
- Table: Timestamp · Method · Endpoint · Status · Latency
- 5 rows of sample data
- GET 200s in green, POST 201s in primary, errors in red

---

## API Keys Tab (`/developers/api-keys`)

### Header
- "API Keys"
- "Create New Key +" primary button right

### Keys Table
Header: NAME · TYPE · CREATED · LAST USED · STATUS · ACTIONS

Row 1:
- "Production Key" bold
- Type badge: "Live" green
- Created: "Jan 15, 2026"
- Last used: "2m ago"
- Status: ● Active green dot
- Actions: "Revoke" red ghost button + copy icon

Row 2:
- "Development Key"
- Type: "Test" amber badge
- Created: "Mar 3, 2026"
- Last used: "Never"
- Status: ● Active
- Actions: copy icon + revoke

Row 3 (revoked):
- "Old Staging Key" — strikethrough/muted
- Type: "Test"
- Status: "Revoked" red badge
- Actions: disabled

### Create Key Modal (show as overlay state)
- Modal card, glass style, 480px
- Title: "Create API Key"
- Input: Key name
- Select: Environment (Live / Test)
- Select: Permissions (Read only / Read + Write / Admin)
- Expiry: Never / 30d / 90d / 1y
- Buttons: "Create Key" primary + "Cancel" ghost

---

## Webhooks Tab (`/developers/webhooks`)

### Header + "Add Webhook +" button

### Webhook Cards (each webhook is a card)

Card 1:
- Top row: "Production Alerts" name bold + "● Active" green dot + toggle switch
- URL: `https://hooks.acme.com/sentient` in monospace foreground-2
- Events subscribed: chips — "agent.action.approved" · "anomaly.detected" · "task.blocked"
- Bottom: "Last triggered: 2m ago" · "Deliveries: 247 (245 success, 2 failed)" · "View logs →"

Card 2:
- "Slack Notifications" + active toggle
- URL: `https://hooks.slack.com/services/T00/B00/xxx`
- Events: "task.assigned" · "project.status.changed"
- "Last triggered: 15m ago"

### Add Webhook Panel (right slide-in):
- URL input
- Select events (searchable multi-select checkboxes)
- Secret key (auto-generated, copy button)
- "Save Webhook" button

---

## Marketplace Tab (`/developers/marketplace`)

### Search + Filter Bar
- Search input: "Search plugins..."
- Filter chips: "All" · "Agents" · "Integrations" · "Analytics" · "Automation"

### Plugin Grid (2×3 grid cards)

Plugin Card Structure:
- Icon (48×48, colored emoji or logo)
- Name bold 15px
- Author "by DevStudio" foreground-3 12px
- Description 13px 2 lines
- Rating: ★★★★☆ (4.2) + install count
- Price tag: "Free" green / "$9/mo" foreground
- "Install" secondary button

Sample plugins:
1. 🔗 **GitHub Advanced** · by Sentient Labs · "Deep GitHub integration with PR analysis" · Free · 1.2k installs
2. 📊 **Datadog Monitor** · by MonitorCo · "Connect Datadog metrics to agent context" · $9/mo · 340 installs
3. 💬 **Slack Connect** · by Sentient Labs · "Rich Slack notifications with agent actions" · Free · 2.1k installs (INSTALLED badge)
4. 🛒 **Shopify Sync** · by CommercePlug · "E-commerce data in your reality stream" · $19/mo · 89 installs
5. 📧 **Email Campaign** · by MailBridge · "Connect email analytics to Nova agent" · $12/mo · 156 installs
6. 🗓 **Calendar Sync** · by Sentient Labs · "Sync deadlines with Google/Outlook" · Free · 890 installs

---

## Light Mode
- Code blocks: `#F0F4F2` bg
- Cards: white
- Table rows: white / `#F5F7F6` alternating
- Same structure

