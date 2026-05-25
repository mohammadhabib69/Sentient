---
name: Deep Forest Light
colors:
  surface: '#f2fcf7'
  surface-dim: '#d3dcd8'
  surface-bright: '#f2fcf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf6f1'
  surface-container: '#e6f0eb'
  surface-container-high: '#e1eae6'
  surface-container-highest: '#dbe5e0'
  on-surface: '#151d1b'
  on-surface-variant: '#404945'
  inverse-surface: '#29322f'
  inverse-on-surface: '#e9f3ee'
  outline: '#707975'
  outline-variant: '#c0c8c4'
  surface-tint: '#39675b'
  primary: '#245347'
  on-primary: '#ffffff'
  primary-container: '#3d6b5f'
  on-primary-container: '#b8e9da'
  inverse-primary: '#a0d0c2'
  secondary: '#8e4e15'
  on-secondary: '#ffffff'
  secondary-container: '#ffab6b'
  on-secondary-container: '#783d02'
  tertiary: '#474c4b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f6463'
  on-tertiary-container: '#dde1df'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbeddd'
  primary-fixed-dim: '#a0d0c2'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#1f4f44'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb782'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#703800'
  tertiary-fixed: '#dfe3e1'
  tertiary-fixed-dim: '#c3c7c6'
  on-tertiary-fixed: '#181c1c'
  on-tertiary-fixed-variant: '#434847'
  background: '#f2fcf7'
  on-background: '#151d1b'
  surface-variant: '#dbe5e0'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '300'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  title-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
This design system embodies a "Nature-meets-High-Tech" aesthetic, moving away from clinical interfaces toward an organic mission control experience. The brand personality is professional yet grounded, evocative of high-end research facilities integrated into natural environments. 

The visual style is a sophisticated blend of **Minimalism** and **Glassmorphism**. It prioritizes clarity and precision while introducing tactile warmth through organic color palettes and soft, diffused depth. The goal is to evoke a sense of calm focus, reliability, and environmental consciousness.

## Colors
The palette is anchored by **Deep Forest Green**, providing a sturdy, authoritative base for primary actions and brand elements. **Amber** serves as a high-contrast accent, used sparingly to draw attention to critical status changes or primary calls to action, injecting warmth into the cool green landscape.

- **Background:** A Sage-tinted off-white (#F0F4F2) reduces eye strain and provides a soft, natural canvas.
- **Surface:** Pure white (#FFFFFF) is reserved for interactive cards and elevated panels to ensure maximum legibility.
- **Glass Effects:** Translucent layers use a subtle forest green tint `rgba(61, 107, 95, 0.05)` with a 12px backdrop blur to maintain the high-tech mission control feel without appearing icy.

## Typography
The typography utilizes **Geist** to maintain technical precision, but adopts lighter weights (300-400) for headlines to achieve a premium editorial feel. 

- **Headlines:** Use Light or Regular weights with slight negative letter-spacing for a modern, "architectural" look.
- **Body Text:** Set in Regular weight with generous line-height to ensure readability against the tinted backgrounds.
- **Labels:** Use SemiBold or Medium weights in all-caps for functional elements to mimic instrumentation readouts.

## Layout & Spacing
The design system employs a **Fixed Grid** on desktop for a structured, dashboard-like feel, transitioning to a **Fluid Grid** on mobile devices. 

- **Rhythm:** A strict 4px baseline grid ensures alignment across all technical components.
- **Desktop:** 12-column layout with a 1280px max-width, 24px gutters, and 40px outer margins.
- **Mobile:** 4-column layout with 16px gutters and 16px margins.
- **Logic:** Elements should prioritize vertical stacking on mobile, while utilizing the wide horizontal space on desktop for side-by-side data visualization and navigation rails.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows** rather than harsh borders. 

- **Level 0 (Background):** Sage Tinted Off-White.
- **Level 1 (Cards):** Pure White with a very soft, multi-layered shadow: `0 4px 20px rgba(45, 54, 51, 0.04)`.
- **Level 2 (Modals/Popovers):** Pure White with a deeper, more diffused shadow and a 1px stroke in `rgba(61, 107, 95, 0.1)`.
- **Glass Layers:** Used for persistent navigation or headers, applying the forest-tinted backdrop blur to create a sense of hardware-software integration.

## Shapes
The shape language is **Rounded**, striking a balance between the precision of the grid and the organic nature of the brand.

- Standard components (Buttons, Inputs) use a 0.5rem (8px) radius.
- Large containers and cards use a 1rem (16px) radius to soften the layout.
- Interactive indicators (Status dots, active tab indicators) may use pill shapes to contrast against the structured grid.

## Components
- **Buttons:** Primary buttons use a solid Deep Forest Green fill with white text. Secondary buttons use a transparent background with a 1.5px Deep Forest Green border.
- **Inputs:** Fields are Pure White with a subtle 1px border in the background-tint color. On focus, the border transitions to Deep Forest Green with a soft outer glow.
- **Chips:** Small, pill-shaped elements using the Sage background color and Deep Forest Green text for a low-intensity, organic look.
- **Cards:** Defined by their Pure White surface and soft ambient shadows. Avoid borders; use padding (minimum 24px) to create internal structure.
- **Progress Indicators:** Use the Amber accent color for active states to provide a warm, "active" signal against the calm green base.
- **Data Tables:** Use subtle horizontal dividers in `rgba(61, 107, 95, 0.08)`. Avoid vertical lines to maintain an open, airy feel.