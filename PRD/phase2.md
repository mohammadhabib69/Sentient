
# Sentient — Phase 2: Frontend Foundation
## Product Requirements Document (AI Agent Implementation Guide)

**Version**: 1.0.0  
**Author**: Mohammad Habib  
**Stack**: Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Zustand · TanStack Query · Framer Motion · Three.js  
**Theme**: Dark (default) + Light — both required  
**Color Palette**: Primary `#74959B` · Secondary `#49776B` · Tertiary `#2C3D33` · BG Dark `#1E201F` · BG Light `#F5F7F6`  
**Sidebar**: iOS 26 Liquid Glass — floating, `blur(28px)`, not attached to edges, spring animated  
**Goal**: Complete frontend — all pages, routing, components, theme system — all data mocked via MSW  
**Prerequisite**: Phase 0 (monorepo, docker) and Phase 1 (Stitch designs) complete  

---

## 1. What Phase 2 Delivers

By end of phase every page exists with routing, mocked data, animations, and the full design system applied. No backend connections — all API calls intercepted by Mock Service Worker (MSW).

| Deliverable | Description |
|---|---|
| Next.js 14 project | Fully configured — TypeScript, App Router, Tailwind with Sentient tokens |
| Theme system | Dark/light switching, all CSS variables, user preference persisted to localStorage |
| iOS 26 Glass sidebar | Floating, `blur(28px)`, spring animation, collapsed/expanded states |
| All 25+ pages | Correct layout, mocked data, Framer Motion animations |
| Component library | Cards, badges, inputs, agent cards, kanban, charts |
| Landing page | Three.js particle field + 3D parallax hero card |
| MSW setup | All API calls mocked with realistic fixture data |
| State management | Zustand stores + TanStack Query hooks fully wired |

---

## 2. Project Setup

### 2.1 Initialize Next.js

Run inside `apps/web/` of the Turborepo monorepo:

```bash
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git
```

**Required flags**:
- App Router (not Pages Router)
- TypeScript strict mode
- Tailwind CSS
- Source directory: `src/`
- Import alias: `@/*` → `./src/*`
- No default example content

### 2.2 Install All Dependencies

```bash
# UI & Components
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card badge dialog dropdown-menu select tabs
pnpm dlx shadcn-ui@latest add input textarea label form
pnpm dlx shadcn-ui@latest add sheet tooltip popover command
pnpm dlx shadcn-ui@latest add progress skeleton avatar separator
pnpm dlx shadcn-ui@latest add table scroll-area alert alert-dialog
pnpm dlx shadcn-ui@latest add calendar switch checkbox radio-group chart

# Animation & UX
pnpm add framer-motion
pnpm add next-themes
pnpm add sonner
pnpm add cmdk
pnpm add @hello-pangea/dnd

# State & Data
pnpm add zustand
pnpm add @tanstack/react-query @tanstack/react-query-devtools
pnpm add axios

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Charts & Visualization
pnpm add recharts
pnpm add @xyflow/react
pnpm add cytoscape react-cytoscapejs
pnpm add three
pnpm add @types/three

# Utilities
pnpm add clsx tailwind-merge date-fns
pnpm add tailwindcss-animate

# Dev & Mocking
pnpm add -D msw
pnpm add -D vitest prettier prettier-plugin-tailwindcss
pnpm add -D @types/cytoscape
```

### 2.3 Tailwind Configuration

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border:      'hsl(var(--border))',
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        // Sentient brand tokens
        'mist-teal':    '#74959B',
        'forest-green': '#49776B',
        'deep-forest':  '#2C3D33',
        'glass-border': 'rgba(116,149,155,0.18)',
        'glass-fill':   'rgba(44,61,51,0.45)',
        'amber-alert':  '#D4874A',
        'error-red':    '#C0504A',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-in-top': 'slideInTop 0.3s ease-out',
        'fade-in':      'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideInTop: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

---

## 3. Theme System

### 3.1 Dark Theme CSS Variables

Add under `.dark` class in `src/app/globals.css`:

```css
.dark {
  --background:        240 11% 4%;      /* #1E201F */
  --foreground:        240 9% 95%;      /* #E8EDE9 */
  --card:              240 10% 7%;      /* #252827 */
  --card-foreground:   240 9% 95%;
  --primary:           192 14% 53%;     /* #74959B */
  --primary-foreground:0 0% 100%;
  --secondary:         158 24% 38%;     /* #49776B */
  --secondary-foreground:0 0% 100%;
  --muted:             240 7% 13%;      /* #1A1A24 */
  --muted-foreground:  240 5% 57%;      /* #9BA89D */
  --border:            240 7% 18%;      /* #2E3330 */
  --radius:            0.625rem;

  /* Sentient custom */
  --surface-1:         #252827;
  --surface-2:         #2E3330;
  --surface-3:         #374039;
  --foreground-2:      #9BA89D;
  --foreground-3:      #5C6B5F;
  --glass-bg:          rgba(44,61,51,0.45);
  --glass-border:      rgba(116,149,155,0.18);
  --glass-highlight:   rgba(255,255,255,0.05);
  --amber:             #D4874A;
  --amber-muted:       rgba(212,135,74,0.12);
  --red:               #C0504A;
  --red-muted:         rgba(192,80,74,0.12);
  --shadow-card:       0 2px 8px rgba(0,0,0,0.30);
  --shadow-float:      0 8px 32px rgba(0,0,0,0.40), 0 0 0 1px rgba(116,149,155,0.08);
}
```

### 3.2 Light Theme CSS Variables

Add under `:root` in `src/app/globals.css`:

```css
:root {
  --background:        120 5% 97%;      /* #F5F7F6 */
  --foreground:        150 5% 12%;      /* #1E201F */
  --card:              0 0% 100%;       /* #FFFFFF */
  --card-foreground:   150 5% 12%;
  --primary:           192 24% 39%;     /* #4D7A80 */
  --primary-foreground:0 0% 100%;
  --secondary:         158 29% 33%;     /* #3D6B5F */
  --secondary-foreground:0 0% 100%;
  --muted:             120 8% 91%;      /* #E8EDEA */
  --muted-foreground:  150 12% 34%;     /* #4A5E52 */
  --border:            140 18% 88%;     /* #DDE6E0 */
  --radius:            0.625rem;

  /* Sentient custom */
  --surface-1:         #FFFFFF;
  --surface-2:         #F0F4F2;
  --surface-3:         #E8EDEA;
  --foreground-2:      #4A5E52;
  --foreground-3:      #8A9E94;
  --glass-bg:          rgba(255,255,255,0.65);
  --glass-border:      rgba(77,122,128,0.18);
  --glass-highlight:   rgba(255,255,255,0.80);
  --amber:             #B8692A;
  --amber-muted:       rgba(184,105,42,0.10);
  --red:               #A03D38;
  --red-muted:         rgba(160,61,56,0.10);
  --shadow-card:       0 1px 4px rgba(0,0,0,0.08);
  --shadow-float:      0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(77,122,128,0.10);
}
```

### 3.3 Theme Behavior Requirements

- **MUST** default to dark mode on first visit
- **MUST** persist preference to `localStorage` key: `'sentient-theme'`
- **MUST** apply theme before render — no flash of wrong theme
- **MUST** use `next-themes` provider: `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`
- **MUST** have theme toggle in top bar (right side) AND Settings > Profile page
- **MUST** use `darkMode: 'class'` in Tailwind config
- Toggle animation: icon rotates 180deg, 300ms ease
- Light mode must be polished — not just "inverted dark"

---

## 4. Folder Structure

### 4.1 App Router (`src/app/`)

| Route | Purpose | Layout |
|---|---|---|
| `(marketing)/page.tsx` | Landing page | Marketing (no sidebar) |
| `(auth)/login/page.tsx` | Login | Auth (centered card) |
| `(auth)/register/page.tsx` | Register | Auth |
| `(auth)/forgot-password/page.tsx` | Forgot password | Auth |
| `(onboarding)/onboarding/org/page.tsx` | Step 1 | Onboarding (progress bar) |
| `(onboarding)/onboarding/team/page.tsx` | Step 2 | Onboarding |
| `(onboarding)/onboarding/workspace/page.tsx` | Step 3 | Onboarding |
| `(onboarding)/onboarding/agents/page.tsx` | Step 4 | Onboarding |
| `(onboarding)/onboarding/done/page.tsx` | Step 5 | Onboarding |
| `(app)/dashboard/page.tsx` | Main dashboard | App shell (glass sidebar) |
| `(app)/agents/page.tsx` | Agent control center | App shell |
| `(app)/agents/[id]/page.tsx` | Agent detail | App shell |
| `(app)/agents/builder/page.tsx` | No-code agent builder | App shell (full bleed) |
| `(app)/stream/page.tsx` | Reality Stream | App shell |
| `(app)/graph/page.tsx` | Business graph | App shell (full bleed) |
| `(app)/projects/page.tsx` | Projects list | App shell |
| `(app)/projects/[id]/page.tsx` | Project overview | App shell |
| `(app)/projects/[id]/board/page.tsx` | Kanban board | App shell (full bleed) |
| `(app)/analytics/page.tsx` | Analytics BI dashboard | App shell |
| `(app)/developers/page.tsx` | Developer portal | App shell |
| `(app)/developers/api-keys/page.tsx` | API keys | App shell |
| `(app)/developers/webhooks/page.tsx` | Webhooks | App shell |
| `(app)/developers/marketplace/page.tsx` | Plugin marketplace | App shell |
| `(app)/settings/page.tsx` | Org settings | App shell |
| `(app)/settings/team/page.tsx` | Team members | App shell |
| `(app)/settings/billing/page.tsx` | Billing + plan | App shell |
| `(app)/settings/integrations/page.tsx` | Integrations | App shell |
| `(app)/settings/security/page.tsx` | Security | App shell |
| `(app)/settings/profile/page.tsx` | Profile + theme toggle | App shell |
| `not-found.tsx` | 404 page | None |
| `error.tsx` | Global error boundary | None |

### 4.2 Components (`src/components/`)

| Folder | Components |
|---|---|
| `ui/` | shadcn/ui generated — do NOT modify |
| `layout/` | `AppShell`, `GlassSidebar`, `Topbar`, `WorkspaceSwitcher`, `MobileNav` |
| `dashboard/` | `MetricCard`, `RealityStreamFeed`, `AgentStatusGrid`, `ProjectsOverview`, `ActivityFeed` |
| `agents/` | `AgentCard`, `ApprovalCard`, `AgentBuilderCanvas`, `AgentConfigPanel`, `ActionHistoryTable` |
| `stream/` | `StreamTimeline`, `EventCard`, `StreamFilters` |
| `graph/` | `BusinessGraph`, `GraphToolbar`, `NodeDetailPanel` |
| `projects/` | `ProjectCard`, `KanbanBoard`, `KanbanColumn`, `TaskCard`, `TaskDetailPanel` |
| `analytics/` | `VelocityChart`, `AgentBreakdownChart`, `ProductivityHeatmap`, `HealthScoreChart`, `AnomalyAlerts` |
| `shared/` | `StatusBadge`, `PriorityBadge`, `UserAvatar`, `AgentAvatar`, `ConfirmDialog`, `EmptyState`, `LoadingSkeleton`, `PageHeader`, `CommandPalette`, `ThemeToggle` |
| `marketing/` | `LandingHero`, `AgentsShowcase`, `StreamPreview`, `PricingSection`, `SiteNavbar`, `SiteFooter` |
| `onboarding/` | `OnboardingCard`, `StepIndicator`, `OrgForm`, `TeamInviteForm`, `AgentSelector` |

### 4.3 Other Directories

| Directory | Purpose |
|---|---|
| `src/store/` | Zustand stores — one file per domain |
| `src/hooks/` | Custom React hooks |
| `src/services/` | API call functions — one file per resource |
| `src/types/` | TypeScript type definitions |
| `src/lib/` | Utilities — `cn()`, validators, constants, queryClient |
| `src/mocks/handlers/` | MSW request handlers |
| `src/mocks/fixtures/` | Static mock data |
| `src/providers/` | React context providers |

---

## 5. Layout Requirements

### 5.1 Root Layout (`src/app/layout.tsx`)

Providers order — outermost to innermost:

1. `ThemeProvider` — `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`
2. `QueryProvider` — `staleTime: 60000`, `retry: 1`
3. `AuthProvider` — reads from Zustand, redirects if needed
4. `Sonner Toaster` — `position="bottom-right"`, `richColors={true}`, theme follows app

Other requirements:
- Fonts: Geist Sans as `--font-sans`, JetBrains Mono as `--font-mono` via `next/font/google`
- `suppressHydrationWarning` on `<html>` — required for next-themes
- Body class includes both font variables

### 5.2 App Shell Layout

- Full viewport height flex row — sidebar left, main content right
- Sidebar is `position: fixed` — does NOT push content
- Main content has `padding-left` equal to sidebar width, transitions smoothly
- Top bar is `sticky top-0` within main content
- Content below top bar scrolls independently

### 5.3 Glass Sidebar — Full Specification

#### Visual Properties

| Property | Value |
|---|---|
| Position | `fixed`, `left: 16px`, `top: 16px` |
| Height | `calc(100vh - 32px)` |
| Width | `72px` collapsed / `240px` expanded |
| Background | `var(--glass-bg)` |
| Backdrop filter | `blur(28px) saturate(180%)` |
| Border | `1px solid var(--glass-border)` |
| Border radius | `20px` |
| Box shadow | `var(--shadow-float)` |
| Top highlight | `inset 0 1px 0 var(--glass-highlight)` |
| z-index | `50` |
| Overflow | `hidden` |

#### Expand/Collapse Behavior

- Default: expanded on desktop (`≥768px`), collapsed on mobile (`<768px`)
- Toggle: circular button on right edge, `56px` from top
- Width animation: Framer Motion spring — `damping: 30`, `stiffness: 300`
- On collapse: labels fade out (80ms) THEN width shrinks
- On expand: width grows THEN labels fade in (100ms delay)
- State persisted to localStorage: `'sentient-sidebar-collapsed'`

#### Navigation Items

- 8 items: Dashboard (⌘1), Agents (⌘2), Reality Stream (⌘3), Graph (⌘4), Projects (⌘5), Analytics (⌘6), Developers (⌘7), Settings (⌘8)
- Active: `background var(--primary) at 12% opacity` + `3px left border var(--primary)` + text in primary color
- Hover: `background var(--glass-bg) at 1.5x opacity` + text in foreground
- Agents item shows amber badge dot when `pendingApprovals > 0`
- Active detection: `usePathname().startsWith(href)`

#### Collapsed Hover Tooltip

- When collapsed + hovering: glass tooltip appears to the right
- Position: `left: calc(72px + 12px)`, aligned vertically to icon
- Background: `var(--glass-bg)` at 85% opacity + `blur(20px)`
- Border: `1px var(--glass-border)`, `border-radius: 10px`
- Content: nav label + keyboard shortcut
- Animation: `opacity 0→1`, `translateX(-4px→0)`, `120ms ease-out`, `60ms delay`
- Disappears on mouse leave, `100ms` fade

#### Sidebar Sections

- **Top**: Logo mark (20×20, rounded, primary color) + "Sentient" wordmark when expanded
- **Below logo**: WorkspaceSwitcher dropdown
- **Middle**: Navigation items
- **Bottom**: Settings item → user avatar + name (expanded only) → "Deploy Agent" glass button (expanded only)

### 5.4 Top Bar

| Property | Value |
|---|---|
| Height | `56px`, sticky `top-0`, `z-index: 40` |
| Background | `var(--background)` at 80% opacity |
| Backdrop filter | `blur(20px) saturate(160%)` |
| Border bottom | `1px var(--border)` |
| Left | Breadcrumb — current page path |
| Center | Search pill — glass style, 360px wide, ⌘K hint, opens CommandPalette |
| Right | Activity icon, notifications bell (unread badge), ThemeToggle, user avatar dropdown |

### 5.5 Other Layouts

| Layout | Spec |
|---|---|
| Auth | No sidebar. 480px centered glass card on background. Logo top of card. |
| Onboarding | No sidebar. 600px centered card. Linear step progress bar top, primary color. |
| Marketing | No sidebar. Full-width. Sticky glass navbar top. |
| Full bleed | Kanban, Graph, Agent Builder: no page padding — fills full space below top bar |

---

## 6. Component Specifications

### 6.1 MetricCard

- **Props**: `title`, `value`, `change?`, `changeType: 'up'|'down'|'neutral'`, `icon`, `description?`
- Background: `var(--surface-1)`, border: `1px var(--border)`, radius: `14px`
- Hover: Framer Motion `whileHover` — `translateY(-2px)`, shadow increases
- Large value: `text-2xl` size, `font-weight: 700`, font-family: mono
- Change color: green for up, red for down, `var(--foreground-3)` for neutral
- Works correctly in both themes

### 6.2 AgentCard

- **Props**: `agent: Agent`, `onToggle: callback`
- 4 types have distinct tints: operations=teal, finance=amber, customer=green, dev=blue
- Active dot: 6px circle, secondary color, pulse animation (`scale 1→1.4→1`, 2s loop) when `isActive`
- Inactive: card at 60% opacity
- Switch toggle top-right, triggers `onToggle`
- Bottom: actions count (today) left, approval mode badge right

### 6.3 ApprovalCard

- **Props**: `action: AgentAction`, `onApprove: callback`, `onReject: callback`
- Border animation: amber border pulses `opacity 0.4→1→0.4`, 1.5s loop
- Risk pill: `low`=green, `medium`=amber, `high`=red
- Expiry countdown: `'23m remaining'` in `text-xs`
- After approve/reject: card animates out (`height→0`, `opacity→0`) and unmounts

### 6.4 EventCard

- Left border color: primary=user event, secondary=agent event, muted=system, red=error
- Stagger: delay = `index × 40ms` on mount
- Timestamp: relative via `date-fns` `formatDistanceToNow`
- Click: expands inline to show full payload in monospace block

### 6.5 TaskCard

- Dragging state: glass background, `blur(8px)`, `scale(1.02)`, deeper shadow
- Priority: 2px left micro-border — red=critical, amber=high, primary=medium, muted=low
- AI-assigned indicator: small agent avatar chip bottom-left when `task.agentAssigned`
- Shows: title, assignee avatar (24px), priority badge, due date, subtask count

### 6.6 StatusBadge

| Status | Background | Text color |
|---|---|---|
| `todo` | `var(--surface-2)` | `var(--foreground-3)` |
| `in_progress` | `var(--primary) at 12%` | `var(--primary)` |
| `review` | `var(--amber-muted)` | `var(--amber)` |
| `done` | `var(--secondary) at 12%` | `var(--secondary)` |
| `blocked` | `var(--red-muted)` | `var(--red)` |

Style: `11px`, weight `500`, `6px` radius, uppercase, `letter-spacing: 0.05em`

### 6.7 CommandPalette

- Triggered by `Cmd+K` (Mac) or `Ctrl+K` (Win/Linux) — global `keydown` listener
- Also opens on search bar click
- Built on `cmdk` library
- Background: `var(--glass-bg)` + `blur(32px)`, border: `1px var(--glass-border)`
- Width: `600px`, max-height: `400px`, centered
- Backdrop overlay: `rgba(0,0,0,0.50)`
- Sections: Recent pages, Quick actions, Navigation
- Animation: `scale 0.96→1`, `opacity 0→1`, `150ms` spring

### 6.8 ThemeToggle

- Moon icon in dark mode, Sun icon in light mode
- Toggles via `next-themes` `useTheme()`
- Icon rotates 180deg on toggle, `300ms ease`
- Tooltip: "Switch to light mode" / "Switch to dark mode"
- Location: top bar right side AND Settings > Profile

---

## 7. Page Requirements

### 7.1 Landing Page (`/`)

#### Hero Section
- Full viewport height (`100vh`)
- Three.js particle field on `<canvas>` behind all content — 200 points in `#74959B` at 15% opacity, slowly drifting, brief connection lines
- Three.js **MUST** be dynamically imported (lazy loaded) — not in initial bundle
- Left column (50%): headline + subheadline + 2 CTAs
- Headline: "Your Business, Running on Intelligence" — 72px, weight 900
- Word "Intelligence" has shimmer animation — bright gradient sweep every 3 seconds
- CTA 1: "Start Free Trial" — forest green bg, 48px height, pill radius, links to `/register`
- CTA 2: "Watch Demo →" — ghost text, arrow slides right on hover
- Right column (50%): 3D glass card, `rotateX(-8deg) rotateY(12deg)`, mouse parallax ±4deg via `useSpring`
- 3D card contains mini Sentient UI (metric row, agent card, stream event)

#### Other Sections (in order)
1. **Agent Showcase** — 4 glass cards (Aria, Nova, Echo, Flux), stagger animate on scroll
2. **Reality Stream Preview** — wide glass panel, 5 event cards, auto-scrolling upward loop
3. **Problem → Solution** — two column, left: chaotic/muted, right: connected/glowing
4. **Pricing** — 4 cards, Pro card elevated `translateY(-8px)` with primary border glow
5. **Footer** — 4-column links + copyright + pulsing green system status dot

### 7.2 Dashboard (`/dashboard`)

- Page title: "Mission Control" label + "System Overview" heading
- Status pills top-right: "System Normal" (green dot) + "Live Update" (amber dot)
- **Metric row**: 4 MetricCards — Active Tasks, Pending Approvals (amber tint when >0), Agent Actions Today, Health Score
- **Main grid** (3-col): Reality Stream feed (2 cols) + Agent Fleet Status (1 col)
- Agent Fleet Status: 2×2 grid of mini agent cards with last action time
- **Below**: Active Projects table (60%) + Topology mini-graph (40%)
- Topology: non-interactive Cytoscape preview, click goes to `/graph`
- **Bottom**: glass command input bar "Issue a command to Sentient..." + "EXECUTE ↗"
- All data from mock fixtures

### 7.3 Agent Control Center (`/agents`)

- Header: "AI Workforce", sub: "Observe · Configure · Approve"
- 4 AgentCards in a row
- Tab bar: "Pending (count)" | "History" | "Config"
- Pending tab: list of ApprovalCards
- Empty state when no pending: Bot icon + "All clear — no pending approvals"
- Bottom: glass command input bar

### 7.4 Reality Stream (`/stream`)

- Two-panel: filter panel left (260px fixed) + timeline right
- Filters: event type chips, actor dropdown, date range, aggregate type
- Timeline: EventCards newest at top
- New mock event slides in every 5 seconds via `setInterval` (dev simulation)
- Clicking event: detail panel slides from right (420px glass panel)
- Detail panel: full event data, actor info, aggregate entity link

### 7.5 Business Graph (`/graph`)

- Full bleed — fills all available space
- Cytoscape.js, canvas background: `#1A201D` (dark) / `#EBF0EC` (light)
- Node colors: User=primary, Project=secondary, Task=amber, Agent=foreground
- Bottleneck nodes: red glow `box-shadow: 0 0 16px #C0504A` + larger size
- Critical path: animated dashed primary edges
- Floating glass toolbar top-right: zoom, fit, filter, highlight bottlenecks, highlight critical path
- Click node: NodeDetailPanel slides from right
- Cytoscape **MUST** be dynamically imported

### 7.6 Kanban Board (`/projects/[id]/board`)

- Full bleed, 5 columns: Todo, In Progress, Review, Done, Blocked
- Drag and drop via `@hello-pangea/dnd`
- Drop into column changes task status in Zustand task store
- Blocked column: 2px red top border, slight `var(--red-muted)` bg tint
- TaskCard dragging state as specified in Section 6.5
- "Add Task" ghost button at bottom of each column
- Click task: TaskDetailPanel slides from right (spring animation)
- TaskDetailPanel: title, description, status select, priority select, assignee picker, files section, event history

### 7.7 Analytics Dashboard (`/analytics`)

- 5 charts in responsive grid
- Task Velocity: line chart, 30 days, primary color line, 20% opacity area fill
- Agent Breakdown: stacked bar chart, each agent distinct color
- Productivity Heatmap: calendar heatmap, forest green scale
- Project Health: donut chart, status distribution
- Anomaly Alerts: severity badge list
- **NO** default recharts colors — all from Sentient palette via CSS variables
- Chart cards have glass header section with title + time range selector

### 7.8 Onboarding Flow

- 5 separate pages, each slides in from right, out to left on Next
- Progress bar top: linear, filled to step %, primary color
- Step 1 Org: name input, industry select, team size select
- Step 2 Team: email input + Add, email chips shown, Skip link
- Step 3 Workspace: name input, description textarea
- Step 4 Agents: 4 agent cards with toggles (Aria + Flux ON by default)
- Step 5 Done: "Reality Engine Ready", particle burst animation, Go to Dashboard button

### 7.9 Developer Portal (`/developers`)

- Sub-tabs: Overview, API Keys, Webhooks, Marketplace
- **API Keys**: table with name, type, created, last used, status, revoke action
- **Webhooks**: cards with URL, events subscribed, delivery stats, toggle
- **Marketplace**: plugin grid — icon, name, author, description, rating, price, install button

### 7.10 Settings Pages

- Sub-nav: Organization, Team Members, Billing, Integrations, Security, Profile
- **Profile page**: large theme toggle section — two large option cards (Dark / Light) with preview thumbnails and selection state

---

## 8. State Management

### 8.1 Zustand Stores (`src/store/`)

| File | State | Key actions |
|---|---|---|
| `ui.store.ts` | `sidebarCollapsed`, `searchOpen`, `activeModal` | `toggleSidebar`, `setSearchOpen`, `openModal`, `closeModal` |
| `auth.store.ts` | `user`, `org`, `accessToken` — **persisted** | `setAuth`, `clearAuth` — use `zustand/middleware persist` |
| `workspace.store.ts` | `activeWorkspaceId`, `workspaces[]` | `setActiveWorkspace`, `setWorkspaces` |
| `agent.store.ts` | `agents[]`, `pendingApprovals[]`, `activeAgentId` | `setAgents`, `addApproval`, `removeApproval`, `approveAction`, `rejectAction` |
| `task.store.ts` | `tasks[]` per project, column order | `updateTask`, `moveTask`, `addTask`, `deleteTask` |
| `notification.store.ts` | `notifications[]`, `unreadCount` | `addNotification`, `markRead`, `markAllRead` |

> Only `auth.store.ts` uses persist middleware. All others are in-memory only.

### 8.2 TanStack Query Hooks (`src/hooks/`)

| Hook file | Queries | Mutations |
|---|---|---|
| `useAuth.ts` | `useCurrentUser()` | `useLogin`, `useRegister`, `useLogout` |
| `useWorkspaces.ts` | `useWorkspaces()`, `useWorkspace(id)` | `useCreateWorkspace`, `useUpdateWorkspace` |
| `useProjects.ts` | `useProjects(workspaceId)`, `useProject(id)` | `useCreateProject`, `useUpdateProject` |
| `useTasks.ts` | `useTasks(projectId)`, `useTask(id)` | `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useMoveTask` |
| `useAgents.ts` | `useAgents()`, `useAgent(id)`, `usePendingActions()` | `useActivateAgent`, `useApproveAction`, `useRejectAction` |
| `useStream.ts` | `useStreamEvents(filters)`, `useStreamEvent(id)` | none — read only |
| `useAnalytics.ts` | `useAnalyticsOverview()`, `useTaskVelocity(days)` | none |
| `useNotifications.ts` | `useNotifications()` | `useMarkRead`, `useMarkAllRead` |

Requirements:
- queryKey pattern: `['resource', id?, filters?]`
- `staleTime: 30000` for most queries
- On mutation success: invalidate related queries
- Loading: show `LoadingSkeleton` — Error: inline message, no page crash

---

## 9. Mock Data (MSW)

### 9.1 Setup

- MSW configured for browser: run `npx msw init public/ --save`
- Active only when `NEXT_PUBLIC_ENABLE_MSW=true`
- Intercepts all `/v1/*` requests
- Handlers: `src/mocks/handlers/` — one file per resource
- Fixtures: `src/mocks/fixtures/` — one file per resource

### 9.2 Fixture Files

| File | Contents |
|---|---|
| `users.fixture.ts` | 5 users — super_admin, org_admin, manager, 2 members. Avatars, roles, `lastActiveAt`. |
| `organizations.fixture.ts` | 1 org — Acme Corp, plan: pro, settings, created date. |
| `workspaces.fixture.ts` | 2 workspaces — Engineering, Marketing. |
| `projects.fixture.ts` | 4 projects — all status types, priorities, due dates. |
| `tasks.fixture.ts` | 25 tasks — all status + priority combos, mix assigned/unassigned. |
| `agents.fixture.ts` | 4 agents (Aria/Nova/Echo/Flux) + 3 pending agent actions. |
| `events.fixture.ts` | 30 events — user, agent, system, 1 error. Realistic timestamps. |
| `notifications.fixture.ts` | 10 notifications — mix read/unread, different types. |
| `analytics.fixture.ts` | 30 days velocity data, agent breakdown, heatmap data. |
| `graph.fixture.ts` | Graph nodes and edges — 2 workspaces, 4 projects, 15 tasks, 5 users, 4 agents. |

### 9.3 MSW Handlers

All responses use shape: `{ success: boolean, data: any }` or `{ success: false, error: string }`

- `GET /v1/agents` → `MOCK_AGENTS` array
- `GET /v1/agents/actions?status=pending` → `MOCK_PENDING_ACTIONS`
- `POST /v1/agents/actions/:id/approve` → `{ success: true, data: { id, status: 'approved' } }`
- `POST /v1/agents/actions/:id/reject` → `{ success: true, data: { id, status: 'rejected' } }`
- `GET /v1/tasks?projectId=:id` → filtered tasks
- `PATCH /v1/tasks/:id` → updated task
- `GET /v1/events` → paginated events
- `GET /v1/analytics/overview` → dashboard metrics

---

## 10. Animation Requirements

All animations use Framer Motion unless noted.

| Animation | Trigger | Config |
|---|---|---|
| Page enter | Route change | `initial: {opacity:0, y:6}` `animate: {opacity:1, y:0}` `duration: 0.2` |
| Card hover lift | `whileHover` | `y: -2`, `transition: {duration: 0.15}` |
| Stagger list | Parent variants | `staggerChildren: 0.05` |
| Slide-in panel | `AnimatePresence` | `initial: {x:'100%'}` `animate: {x:0}` `exit: {x:'100%'}` spring `damping:30 stiffness:300` |
| Sidebar width | `animate` prop | spring `damping:30 stiffness:300` |
| Approval pulse | `animate` on div | `borderColor` amber→lighter→amber, `1.5s repeat:Infinity` |
| Active agent dot | `animate` on span | `scale:[1,1.4,1]` `opacity:[0.7,1,0.7]` `duration:2 repeat:Infinity` |
| Command palette | `AnimatePresence` | `scale:0.96→1` `opacity:0→1` spring `damping:25` |
| Number tick | on value change | `useMotionValue` + `useSpring` counter animation |
| 3D card parallax | `onMouseMove` | `useSpring(rotateX, {stiffness:150, damping:20})` |
| Sidebar tooltip | `onHoverStart` | `opacity:0→1` `x:-4→0` `duration:0.12 delay:0.06` |

---

## 11. TypeScript Types

### Core Types (`src/types/`)

```typescript
// organization.types.ts
export type Plan = 'free' | 'pro' | 'business' | 'enterprise'
export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'member' | 'guest'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: Plan
  settings: Record<string, unknown>
  createdAt: string
}

export interface User {
  id: string
  orgId: string
  email: string
  name: string
  avatarUrl: string | null
  role: UserRole
  lastActiveAt: string
}

// task.types.ts
export type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee: User | null
  agentAssigned: boolean
  dueDate: string | null
  estimatedHours: number | null
  position: number
  createdAt: string
  updatedAt: string
}

// agent.types.ts
export type AgentType    = 'operations' | 'finance' | 'customer' | 'dev' | 'custom'
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
export type ApprovalMode = 'always' | 'auto_low_risk' | 'never'

export interface Agent {
  id: string
  name: string
  type: AgentType
  isActive: boolean
  approvalMode: ApprovalMode
  actionsCount: number
  config: Record<string, unknown>
}

export interface AgentAction {
  id: string
  agentId: string
  agentName: string
  actionType: string
  description: string
  payload: Record<string, unknown>
  status: ActionStatus
  riskLevel: 'low' | 'medium' | 'high'
  expiresAt: string
  createdAt: string
}

// event.types.ts
export type ActorType = 'user' | 'agent' | 'system'

export interface StreamEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  payload: Record<string, unknown>
  actor: { id: string; name: string; type: ActorType; avatarUrl?: string }
  occurredAt: string
}

// api.types.ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  meta?: { page: number; limit: number; total: number }
}
```

---

## 12. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_MSW=true
NEXT_PUBLIC_ENABLE_DEVTOOLS=true
NEXT_PUBLIC_APP_ENV=development
```

Also create `.env.example` with same keys, empty values.

---

## 13. Quality Requirements

### TypeScript
- `strict: true` in `tsconfig.json`
- No `any` types — use `unknown` if necessary
- All component props have explicit interfaces
- Zero errors on: `tsc --noEmit`

### Responsiveness
- Sidebar: icon-only on `< 768px`
- Usable at `375px`, `768px`, `1440px`
- Metric cards: 1 col mobile, 2 col tablet, 4 col desktop
- Kanban: horizontal scroll on mobile

### Performance
- Three.js: `dynamic import` only
- Cytoscape: `dynamic import` only
- Images: `Next.js Image` component
- No `useEffect` data fetching — use TanStack Query
- No unnecessary re-renders — memoize expensive components

### Accessibility
- All icon-only buttons have `aria-label`
- Keyboard navigation: sidebar, command palette, approval buttons
- Color never the only status indicator — always pair with text/icon
- Focus rings visible in both themes using `var(--primary)`

---

## 14. Phase 2 Completion Checklist

### Setup & Config
- [ ] Next.js 14 initialized with correct flags
- [ ] All dependencies installed
- [ ] Tailwind configured with Sentient tokens
- [ ] Dark CSS variables complete
- [ ] Light CSS variables complete
- [ ] Fonts loaded (Geist + JetBrains Mono)
- [ ] MSW configured (`public/mockServiceWorker.js` generated)
- [ ] `.env.local` and `.env.example` created

### Theme
- [ ] Dark mode: all pages look correct
- [ ] Light mode: all pages look correct
- [ ] Theme toggle in top bar
- [ ] Theme toggle in Settings > Profile (two large option cards)
- [ ] Theme persists on refresh
- [ ] No flash of wrong theme on load

### Layout & Sidebar
- [ ] Glass sidebar renders in both themes
- [ ] Expand/collapse spring animation works
- [ ] Sidebar state persists on refresh
- [ ] Collapsed tooltip appears on hover
- [ ] Active nav item correct on all pages
- [ ] Amber badge on Agents when pending > 0
- [ ] Top bar correct in both themes

### All Pages
- [ ] Landing page with particle field and 3D card
- [ ] Login, Register, Forgot Password
- [ ] All 5 onboarding steps with slide transitions
- [ ] Dashboard — all sections
- [ ] Agent Control Center — cards, approvals, command input
- [ ] Reality Stream — filters, live simulation
- [ ] Business Graph — Cytoscape with mock data
- [ ] Kanban Board — drag and drop works
- [ ] Task Detail Panel — slide animation
- [ ] Analytics — 5 charts with Sentient colors
- [ ] Developer Portal + sub-pages (API keys, webhooks, marketplace)
- [ ] All 6 Settings sub-pages
- [ ] 404 and Error pages

### Components
- [ ] MetricCard — both themes, hover lift
- [ ] AgentCard — all 4 types, pulse dot, toggle
- [ ] ApprovalCard — amber pulse, exit animation
- [ ] EventCard — left border colors, stagger, expand
- [ ] TaskCard — drag state, priority border
- [ ] StatusBadge + PriorityBadge — all variants
- [ ] CommandPalette — Cmd+K opens, keyboard nav works
- [ ] ThemeToggle — rotates on click

### State & Mocks
- [ ] All Zustand stores created and connected
- [ ] All TanStack Query hooks created
- [ ] All fixture files with realistic data
- [ ] All MSW handlers returning correct shapes
- [ ] No real API calls — MSW intercepts all

### Quality
- [ ] Zero TypeScript errors (`tsc --noEmit`)
- [ ] Zero ESLint errors
- [ ] Responsive at 375px, 768px, 1440px
- [ ] Three.js and Cytoscape lazy loaded
- [ ] All icon-only buttons have `aria-label`



                            --End Of Phase 2--