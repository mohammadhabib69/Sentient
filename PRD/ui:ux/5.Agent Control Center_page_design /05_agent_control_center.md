# Sentient — Agent Control Center
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Agent Control Center (`/agents`)
**Layout**: App shell (glass sidebar + top bar)
**Show**: Dark AND light mode

---

## Page Header
- "AI Workforce" — 20px bold foreground
- Sub: "Observe · Configure · Approve" — 13px foreground-2
- Right side: "Builder →" ghost button to go to agent builder

---

## Active Agents Section
Label: "ACTIVE AGENTS" in 11px uppercase foreground-3

**4 agent cards in a row** (equal width, ~240px each):

### Card Structure (each agent)
- Top row: colored avatar square (40×40, rounded 12px) + agent name bold + type label small + toggle switch right
- Avatar contents: 2-letter initials
- Active status: pulsing green dot (6px) in top-right of avatar
- Middle: last action preview text (13px foreground-2, 2 lines max, truncated)
- Bottom row: "34 actions today" foreground-3 left · approval mode badge right

**Aria — Operations**
- Avatar: "AR" in teal (`rgba(116,149,155,0.20)` bg)
- Toggle: ON (green)
- Last action: "Reassigned 'API Migration' from inactive user to Sarah"
- Badge: "Always approve"

**Nova — Finance**
- Avatar: "NV" in amber (`rgba(212,135,74,0.20)` bg)
- Toggle: ON
- Last action: "Anomaly detected in Stripe batch #842"
- Badge: "Auto low-risk"

**Echo — Customer**
- Avatar: "EC" in green (`rgba(73,119,107,0.20)` bg)
- Toggle: OFF (grayed, card at 60% opacity)
- Last action: "—"
- Badge: "Inactive"

**Flux — Development**
- Avatar: "FL" in blue (`rgba(37,99,235,0.20)` bg)
- Toggle: ON
- Last action: "PR priority escalation on sentient-core"
- Badge: "Always approve"

---

## Pending Approvals Section
Label: "PENDING APPROVALS" in amber color + clock icon + count badge "7"

**Tab bar**: "Pending (7)" active tab · "History" · "Config" — glass tab style

### Approval Cards (stacked vertically)

**Approval Card 1** (High priority — amber pulsing border):
- Top row: "AR Aria" teal chip (agent name) · "reassign_task" action type badge · risk pill "LOW RISK" green · expiry "Expires in 23m" foreground-3
- Main text: "Reassign 'Fix login bug' from inactive user (John) to Sarah Kim (available, 30% capacity)"
- Impact note: "⚡ Impact: 1 task, 2 users affected" in foreground-2 13px
- Bottom row: "APPROVE ✓" green glass button + "REJECT ✗" red glass button + "View details →" ghost link

**Approval Card 2** (Medium — normal border):
- Agent: "FL Flux" blue chip · "create_github_issue" · "MEDIUM RISK" amber · "Expires in 1h"
- Text: "Create GitHub issue for repeated 500 errors on /api/tasks endpoint (detected 14 times in 2h)"
- Impact: "⚡ Impact: Dev team notified, issue tracker updated"
- Buttons: same structure

**Approval Card 3**:
- Agent: "NV Nova" · "send_payment_reminder" · "LOW RISK"
- Text: "Send payment reminder to Meridian Corp — invoice #INV-2841, 7 days overdue ($4,200)"
- Buttons: same

---

## Command Input Bar (bottom)
Same as dashboard — full width glass input "Issue a command to Sentient..." + "EXECUTE ↗"

---

## Agent Detail Panel (when clicking an agent card)
Slides in from right (420px wide glass panel):
- Agent name + type + status top
- Tabs: Overview · Actions · Config · Memory
- Overview: stats (actions today, actions this week, approval rate %)
- Graph: line chart showing actions over last 7 days
- Recent actions list: 5 most recent with status badges

---

## Light Mode
- Cards: white
- Approval cards: amber tint bg for pending
- Toggle ON: secondary green
- All text tokens switched to light values

