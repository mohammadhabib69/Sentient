---
name: Sentient Mission Control
colors:
  surface: '#121413'
  surface-dim: '#121413'
  surface-bright: '#383a38'
  surface-container-lowest: '#0d0f0e'
  surface-container-low: '#1a1c1b'
  surface-container: '#1e201f'
  surface-container-high: '#282a29'
  surface-container-highest: '#333534'
  on-surface: '#e2e3e0'
  on-surface-variant: '#c1c8c9'
  inverse-surface: '#e2e3e0'
  inverse-on-surface: '#2f3130'
  outline: '#8b9293'
  outline-variant: '#414849'
  surface-tint: '#aaccd3'
  primary: '#aaccd3'
  on-primary: '#13353a'
  primary-container: '#75969c'
  on-primary-container: '#0a2e33'
  inverse-primary: '#436469'
  secondary: '#a0d0c2'
  on-secondary: '#02382e'
  secondary-container: '#1f4f44'
  on-secondary-container: '#8fbfb1'
  tertiary: '#b8cbbd'
  on-tertiary: '#23342a'
  tertiary-container: '#829589'
  on-tertiary-container: '#1d2d24'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c6e9ef'
  primary-fixed-dim: '#aaccd3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#2b4c51'
  secondary-fixed: '#bbedde'
  secondary-fixed-dim: '#a0d0c2'
  on-secondary-fixed: '#00201a'
  on-secondary-fixed-variant: '#1f4f44'
  tertiary-fixed: '#d4e7d9'
  tertiary-fixed-dim: '#b8cbbd'
  on-tertiary-fixed: '#0e1f16'
  on-tertiary-fixed-variant: '#394b40'
  background: '#121413'
  on-background: '#e2e3e0'
  surface-variant: '#333534'
  mist-teal: '#74959B'
  forest-green: '#49776B'
  deep-forest: '#2C3D33'
  amber-alert: '#D4874A'
  error-red: '#C0504A'
  glass-border: rgba(116, 149, 155, 0.18)
  glass-fill: rgba(44, 61, 51, 0.45)
typography:
  hero-900:
    fontFamily: Geist Sans
    fontSize: 72px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-2xl:
    fontFamily: Geist Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-xl:
    fontFamily: Geist Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Geist Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  metric-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1'
  label-caps:
    fontFamily: Geist Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-xs:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  2xl: 4rem
  container-max: 1280px
  gutter: 1.5rem
  sidebar-width: 240px
  sidebar-gap: 1rem
---

## Brand & Style

The design system embodies a **High-Tech Mission Control** aesthetic, specifically tailored for an AI-native business environment. It balances the raw power of autonomous intelligence with the sophisticated clarity of a strategic operations center. The brand personality is observant, decisive, and alive, moving away from generic SaaS aesthetics toward a specialized "Intelligence Engine."

### Design Style: Glassmorphism & Modern Technical
The visual language leverages **Glassmorphism** as its core structural metaphor. UI elements are treated as translucent physical panes floating over a deep, atmospheric void.
- **Atmospheric Depth:** Uses background blurs and semi-transparent layers to create a sense of vast digital space.
- **Living Intelligence:** The UI is never static. Subtle animations (pulsing status indicators, drifting particle fields, and shifting gradients) suggest a system that is constantly "thinking" and processing data in real-time.
- **Precision Engineering:** High-contrast typography and monospaced data points provide a functional, utilitarian counter-balance to the ethereal glass effects.

## Colors

The palette is rooted in a "Forest, Mist, and Stone" narrative, eschewing standard tech blues for a more organic yet technical feel.

### Dark Mode (Default)
- **Primary (Mist Teal):** Used for primary actions, active indicators, and high-level branding.
- **Secondary (Forest Green):** Represents growth, successful execution, and active agent states.
- **Surface Strategy:** The background is a deep obsidian (#1E201F). Surfaces stack from Surface 1 (#252827) to Surface 3 (#374039), increasing in lightness as they approach the user.

### Light Mode
- **Background:** Shifts to a warm, breathable off-white (#F5F7F6).
- **Glass Effects:** Transitions to a white-base glass (`rgba(255, 255, 255, 0.65)`) with more pronounced borders (#DDE6E0) to maintain legibility.
- **Contrast:** Primary and Secondary colors are slightly darkened for accessibility against light backgrounds.

## Typography

Typography is a critical tool for establishing the "Mission Control" feel. We utilize two distinct families:

1.  **Geist Sans:** Used for all structural UI and marketing copy. Its clean, geometric sans-serif nature feels engineered and modern.
2.  **JetBrains Mono:** Used exclusively for "Reality Data"—numbers, status logs, IDs, and metrics. This reinforces the feeling of raw data being processed by the engine.

**Scaling Rules:**
- On mobile devices, the 72px Hero text should scale down to **48px** to maintain readability and prevent horizontal overflow.
- Use **Label-Caps** for category headers above headlines to provide context without visual clutter.

## Layout & Spacing

The layout follows a **Hybrid Fluid Grid** system. Marketing pages utilize a centered 12-column container, while the application dashboard uses a workspace-focused layout.

### Layout Principles:
- **Floating Containers:** The sidebar and main content panels do not touch the edges of the viewport. A consistent **16px (1rem)** gap is maintained around the perimeter of the screen to emphasize the "floating pane" aesthetic.
- **Density:** The UI is "information-dense but clear." Space is used to group related logical blocks (e.g., Agent Cards) rather than to separate disparate elements.
- **Breakpoints:**
  - **Mobile (<768px):** Single column. Sidebar collapses to a bottom navigation bar or a hidden drawer. Glass blurs are reduced to optimize performance.
  - **Desktop (>1024px):** 12-column layout with fixed 240px floating sidebar.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Opacity** and **Refraction**, rather than traditional high-offset shadows.

- **Layer 0 (Void):** The base background (#1E201F). It often contains a faint particle field or "neural" background animation.
- **Layer 1 (Standard Cards):** Solid surfaces (#252827) with a subtle 1px border.
- **Layer 2 (Glass Floating Panels):** These sit "closest" to the user. They use `backdrop-filter: blur(20px)` and a `rgba(116, 149, 155, 0.18)` border. The border acts as a "specular highlight," catching light at the edges of the glass.
- **Shadows:** Use large, very soft ambient shadows (`0 24px 64px rgba(0,0,0,0.50)`) for floating hero elements, but avoid them for standard flat-on-surface cards.

## Shapes

The shape language is "Soft-Technical"—rounded enough to feel approachable and modern, but disciplined enough to maintain a professional atmosphere.

- **Standard Radius:** 8px (0.5rem) for inputs and small cards.
- **Large Radius:** 16px (1rem) for major containers and Agent Cards.
- **System Radius:** 20px (1.25rem) specifically for the floating glass sidebar.
- **Pill Radius:** Used exclusively for "Status Badges" and the "Search Pill" to differentiate them from actionable buttons.

## Components

### Agent Cards
The primary entity in the system.
- **Header:** Initials avatar with a **Status Pulse**. The pulse is a 2px outer glow that breathes (opacity 0.4 to 1.0) in the agent's theme color (e.g., Secondary Green).
- **Body:** Contains agent role, description, and "Live Preview" text in **JetBrains Mono**.
- **Border:** Features a 3px colored top-border corresponding to the agent's functional domain.

### Event Cards (Reality Stream)
Used for the continuous log of AI actions.
- **Structure:** Vertical list items with a 4px colored "left-rail" border.
- **Content:** [Timestamp] [Agent Name] [Action Type] [Payload Description].
- **Animation:** New events slide in from the bottom with a subtle fade-in and upward motion.

### Buttons
- **Primary:** Forest Green (#49776B) background, solid white text.
- **Glass/Ghost:** Transparent background with a `1px glass-border`. Hover state increases background opacity and blur intensity.
- **Shape:** Buttons use a 10px radius, slightly sharper than cards to feel more "active."

### Input Fields
- **Style:** Dark background (#1A1C1B) with a subtle inset shadow and 1px border (#2E3330). 
- **Focus State:** Border changes to Mist Teal with a 2px outer glass glow.

### Social Proof / Logos
- Rendered in grayscale at 40% opacity. On hover, they transition to their brand color or the primary mist teal.