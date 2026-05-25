# Sentient — Onboarding Flow (5 Steps)
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Layout: Onboarding Layout
- No sidebar
- Centered content, max-width 640px
- Background: app background with very subtle radial gradient center glow in primary color at 5% opacity
- Progress bar at top of each step
- Show dark AND light mode

---

## Progress Bar (appears on all steps)
- Full width, 4px height, sits at very top of page
- Background track: `#374039` (dark) / `#DDE6E0` (light)
- Filled portion: primary color `#74959B`
- Below bar: 5 step labels in a row — "Organization · Team · Workspace · Agents · Ready"
- Current step label in primary color, others in foreground-3
- Small dot above each label — filled circle for completed, outline for current, empty for future

---

## Step 1: Create Organization (`/onboarding/org`)
**Progress**: 20% filled

### Card (glass style, 640px wide, centered)
- Small label above heading: "STEP 1 OF 5" in primary color, 11px uppercase
- Heading: "Set up your organization"
- Sub: "This is your company's home on Sentient"
- **Organization name input**: label "Organization name", placeholder "Acme Corp"
- **Industry select**: label "Industry", dropdown — Technology, Finance, Healthcare, E-commerce, Other
- **Team size select**: label "Team size", dropdown — Just me, 2-10, 11-50, 51-200, 200+
- **Continue button**: full width primary button "Continue →"
- Bottom: step indicator "1 of 5"

---

## Step 2: Invite Team (`/onboarding/team`)
**Progress**: 40% filled

### Card
- "STEP 2 OF 5"
- Heading: "Invite your team"
- Sub: "Agents work better when they know your team"
- **Email input row**: email input + "Add" secondary button side by side
- **Added emails area**: shows chips for added emails (e.g. "james@acme.com ✕"), stacked below input
- **"Skip for now →"** link below in foreground-2
- **Continue button**: primary, full width

---

## Step 3: Create Workspace (`/onboarding/workspace`)
**Progress**: 60% filled

### Card
- "STEP 3 OF 5"
- Heading: "Create your first workspace"
- Sub: "Workspaces organize your projects and agents"
- **Workspace name input**: placeholder "Engineering", "Marketing", "Operations"
- **Description textarea**: optional, 3 rows, placeholder "What does this workspace focus on?"
- **Continue button**: primary

---

## Step 4: Choose Agents (`/onboarding/agents`)
**Progress**: 80% filled

### Card (slightly wider, 720px)
- "STEP 4 OF 5"
- Heading: "Activate your AI workforce"
- Sub: "Select which agents to deploy. You can change this anytime."
- **4 agent selection cards** in a 2×2 grid:

Each agent card:
- Left: colored avatar circle with initials
- Middle: agent name (bold) + description (13px foreground-2)
- Right: toggle switch (ON by default for Aria and Flux, OFF for others)
- Card has active state: primary-muted bg + primary border when toggle is ON
- Active dot on avatar when ON

Cards:
1. **Aria** (AR, teal) — "Operations Agent · Manages tasks, deadlines, and team assignments"
2. **Nova** (NV, amber) — "Finance Agent · Tracks invoices, anomalies, and cash flow"
3. **Echo** (EC, green) — "Customer Agent · Monitors sentiment and client communication"
4. **Flux** (FL, blue) — "Dev Agent · GitHub integration, bug tracking, deployments"

- **Continue button**: primary, "Activate Selected Agents →"

---

## Step 5: Done (`/onboarding/done`)
**Progress**: 100% filled (full bar in secondary/green color)

### Card (centered, celebratory)
- **Top**: burst/sparkle animation area — small green and teal particles radiating from center
- **Icon**: checkmark in a large green glass circle (64px)
- Heading: "Your reality engine is ready" — 28px bold
- Sub: "Aria and Flux are now monitoring your organization" — foreground-2
- **Three feature pills** in a row: "✓ 2 Agents Active" · "✓ 1 Workspace Created" · "✓ Team Notified"
  - Each: glass pill, secondary-muted bg, secondary text
- **"Go to Dashboard →"** large primary button
- Below: "or explore the documentation first →" ghost link

---

## Light Mode Notes
- Cards: white `rgba(255,255,255,0.85)` + light border
- Progress track: `#DDE6E0`
- Toggle ON: secondary green color
- All same layout, light color values

