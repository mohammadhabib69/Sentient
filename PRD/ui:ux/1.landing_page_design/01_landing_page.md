# Sentient — Landing Page (Marketing)
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Page: Landing Page
**URL**: `/`
**Layout**: Full-width marketing page. No sidebar. Sticky glass navbar at top.
**Theme**: Show BOTH dark mode and light mode variants side by side or as separate screens.

---

## Navbar (Sticky Top)
- Background: app background at 75% opacity + blur(20px)
- Border bottom: 1px glass border
- Height: 64px
- Left: Sentient logo mark (small rounded square in primary color) + "Sentient" wordmark
- Center: Nav links — Product, Pricing, Docs, Blog (14px, foreground-2)
- Right: "Sign In" ghost button + "Get Started" primary button (forest green bg)
- Light mode: same structure, white/light background with blur

---

## Section 1: Hero
**Height**: 100vh (full viewport)

### Background
- Base color: `#1E201F` (dark) / `#F5F7F6` (light)
- Animated particle field fills entire background:
  - ~200 small dots in primary color (`#74959B`) at 15% opacity
  - Dots drift slowly in random directions
  - When two dots are close, a faint line briefly connects them
  - Creates a living neural-network feel

### Content Layout
Two columns:

**Left column (50%)**:
- Label above headline: "MISSION CONTROL" in 11px uppercase primary color with letter-spacing
- Headline: **"Your Business, Running on Intelligence"**
  - Font: 72px, weight 900, foreground color
  - The word "Intelligence" has a shimmer effect — a bright gradient sweeps across it
- Subheadline: "Sentient deploys autonomous AI agents to observe, decide, and act — while you stay in control." — 18px, foreground-2, max-width 520px
- CTA row:
  - Button 1: "Start Free Trial" — forest green bg, white text, 48px height, 24px radius (pill-ish)
  - Button 2: "Watch Demo →" — ghost text link, arrow animated to slide right on hover
- Below CTAs: "No credit card required · 14-day free trial · Cancel anytime" in 11px foreground-3

**Right column (50%)**:
- A glass card floating in 3D perspective — tilted `rotateX(-8deg) rotateY(12deg)`
- Card shows mini Sentient dashboard UI inside:
  - Top: tiny top bar with "Sentient" text
  - A metric row with 2 small metric cards
  - One agent card showing "Aria — Operations" with a pulsing green dot
  - One stream event card sliding in
- Card has real shadow: `0 24px 64px rgba(0,0,0,0.50)`
- Card border: glass border style
- Card border-radius: 16px

---

## Section 2: Social Proof Bar
- Thin section, 80px height
- Text: "Trusted by forward-thinking teams at" in foreground-3
- Row of 5 company logos (grayscale, placeholder names: Acme, Horizon, Volt, Meridian, Apex)
- Logos hover to slight color

---

## Section 3: Agent Showcase
- Section title: "Your AI Workforce" centered, 32px bold
- Sub: "Four specialized agents that run your operations autonomously" in foreground-2
- 2×2 grid of glass agent cards:

**Aria — Operations**
- Avatar: "AR" initials in teal circle
- Active dot: pulsing green top-right of avatar
- Description: "Monitors tasks, detects delays, reassigns work before deadlines slip"
- Live preview text: "Just now: Reassigned 'API migration' to Sarah (available)"

**Nova — Finance**
- Avatar: "NV" in amber circle
- Description: "Tracks invoices, flags anomalies, forecasts cash flow in real time"
- Live preview: "2m ago: Anomaly in batch #842 — 3 transactions flagged"

**Echo — Customer**
- Avatar: "EC" in green circle
- Description: "Reads client sentiment, drafts responses, escalates critical issues"
- Live preview: "5m ago: Escalated ticket #291 — sentiment: urgent"

**Flux — Development**
- Avatar: "FL" in blue circle
- Description: "Monitors GitHub, prioritizes bugs, suggests deployments"
- Live preview: "Just now: PR priority escalation on sentient-core"

Each card: glass card style, 300px wide, colored top border (3px) matching agent color

---

## Section 4: Reality Stream Preview
- Full-width glass panel
- Title left: "Reality Stream" with Activity icon
- Sub: "Every action, every decision — live"
- Shows 5 event cards in a vertical list, slowly auto-scrolling upward:
  1. [Teal left border] Flux (Dev) — SUGGESTION — "Suggests PR priority escalation on sentient-core"
  2. [Amber left border] Nova (Finance) — ANOMALY — "Detected anomaly in Stripe batch #842"
  3. [Muted left border] User (Mohammad) — APPROVAL — "Approved manual override for agent action #102"
  4. [Teal left border] Aria (Ops) — ACTION — "Reassigned task 'Deploy staging' to James"
  5. [Red left border] System — ERROR — "Agent Echo failed to connect to CRM API, retrying"

---

## Section 5: Problem → Solution
- Two column layout
- Left: "Without Sentient" — desaturated, gray icons, scattered, disconnected feel. Labels: "47 tools", "Manual work", "Missed deadlines", "No insights"
- Right: "With Sentient" — everything connected, glowing in primary/secondary colors. Labels: "One platform", "Autonomous agents", "Always on time", "Live intelligence"
- Arrow or divider between columns

---

## Section 6: Pricing
- Title: "Simple, transparent pricing" centered
- 4 pricing cards in a row:

**Free**
- Price: $0/mo
- Features: 1 agent, 100 actions/mo, 1 workspace
- CTA: "Get started free" — secondary button

**Pro** ⭐ (recommended — visually elevated)
- Price: $49/mo
- Card is elevated: translateY(-12px), primary color border glow (`0 0 24px rgba(116,149,155,0.25)`)
- "Most Popular" badge top-right in primary color
- Features: 4 agents, 10,000 actions/mo, 5 workspaces, analytics
- CTA: "Start free trial" — primary button

**Business**
- Price: $199/mo
- Features: 10 agents, unlimited actions, unlimited workspaces, priority support
- CTA: "Start free trial" — secondary button

**Enterprise**
- Price: "Custom"
- Features: Unlimited everything, on-premise option, SLA, dedicated support
- CTA: "Contact us" — ghost button

---

## Section 7: Footer
- Background: slightly darker than page bg (`#1A1C1B` dark / `#EEF0EF` light)
- 4 columns: Product (Dashboard, Agents, Stream, Graph, Analytics), Company (About, Blog, Careers, Press), Developers (API Docs, Webhooks, Marketplace, Status), Legal (Privacy, Terms, Security)
- Bottom bar: "© 2026 Sentient Inc." left · Status dot (pulsing green) + "All systems operational" center · Social icons right

---

## Light Mode Differences
- Background: `#F5F7F6`
- Cards: white with `1px #DDE6E0` border
- Particle field: dots in `#4D7A80` at 10% opacity
- Navbar: white/light bg with blur
- Text: dark (`#1E201F`)
- Buttons: same but primary uses `#4D7A80` instead of `#49776B`
- Glass panels: `rgba(255,255,255,0.65)` with blur

