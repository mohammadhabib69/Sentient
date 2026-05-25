# Sentient — Agent Builder Canvas
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: No-Code Agent Builder (`/agents/builder`)
**Layout**: App shell, FULL BLEED canvas
**Show**: Dark AND light mode

---

## Page Header (above canvas)
- Breadcrumb: "Agents → Builder"
- Center: "Custom Agent Builder" title
- Right: "Save Draft" ghost + "Deploy Agent 🚀" primary button + "Test" secondary button

---

## Canvas (fills entire content area below header)
Background: `#16191A` (dark) / `#EAEEF0` (light) — distinct from app bg
Dotted grid pattern: very subtle dots every 24px in foreground at 8% opacity

---

## Left Panel — Node Library (240px, glass style)
Title: "NODES" 11px uppercase

Sections with node type chips (drag to canvas):

**Triggers**:
- ⏰ "Schedule" — run on cron
- 📥 "Event" — on Reality Stream event
- 🔗 "Webhook" — external trigger

**Conditions**:
- ⚖️ "If/Else" — branch logic
- 🔍 "Filter" — filter data
- 🔢 "Compare" — compare values

**Actions**:
- ✉️ "Send Email"
- 📋 "Create Task"
- 🔁 "Reassign Task"
- 💬 "Post to Slack"
- 🔗 "Call Webhook"
- 🤖 "Run AI Prompt"

**Data**:
- 🗄️ "Get Data"
- 📊 "Transform"
- 💾 "Store Value"

Each node chip: surface-1 bg, 1px border, 8px radius, icon + label, drag handle hint

---

## Canvas Content — Sample Agent Flow
Show a pre-built example flow on canvas:

**Node 1 — Trigger** (top, blue):
- Large rounded card, 200px wide
- Header: ⏰ "Schedule Trigger" in blue bg
- Body: "Every weekday at 9:00 AM"
- Output handle: small circle on right edge

**Arrow** → (animated flowing dots along the path)

**Node 2 — Condition** (middle-left, amber):
- "If / Else" card
- Body: "IF overdue_tasks > 0"
- Two output handles: "True ✓" (right) and "False ✗" (bottom)

**Arrow from True** →

**Node 3 — AI Prompt** (right side, primary teal):
- "Run AI Prompt" card
- Body: "Analyze overdue tasks and suggest reassignment" (truncated)
- Input handle left, output handle right

**Arrow** →

**Node 4 — Action** (far right, green):
- "Reassign Task" card
- Body: "Reassign to: {{ai_suggestion.assignee}}"
- Shows variable chip `{{ai_suggestion.assignee}}` in primary color

**Arrow from False** ↓

**Node 5 — Action** (below node 2, green):
- "Send Email" card
- Body: "To: manager@company.com · Subject: All tasks on track ✓"

---

## Node Detail Panel (right side, 320px, glass)
Shows when a node is selected (e.g. Node 3 is selected):

- Top: node type icon + "Run AI Prompt" bold + close X
- **Model**: "GPT-4o" select dropdown
- **System prompt**: textarea pre-filled with context
- **User prompt**: textarea with variable chips visible (drag-in from data panel)
- **Output variable**: input `{{ai_result}}`
- **Temperature**: slider 0.0 to 1.0, at 0.7
- Bottom: "Test this node" ghost button

---

## Floating Toolbar (bottom-center of canvas)
Glass pill:
- Undo · Redo · | · Zoom: "85%" · Fit to screen · | · Delete selected

---

## Light Mode
- Canvas: `#EAEEF0` bg, darker grid dots
- Left panel: white glass
- Nodes: white cards with colored headers
- Connections: darker lines

