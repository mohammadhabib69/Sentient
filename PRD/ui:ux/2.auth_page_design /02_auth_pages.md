# Sentient — Auth Pages (Login / Register / Forgot Password)
> Paste the Design System Reference (00_design_system.md) above this before submitting to Stitch.

---

## Layout: Auth Layout
- No sidebar, no top bar
- Full viewport — centered content
- Background: app background (`#1E201F` dark / `#F5F7F6` light)
- Subtle particle field or gradient radial glow in background (optional, very subtle)
- Show dark AND light mode for each page

---

## Page 1: Login (`/login`)

### Card (centered, 480px wide)
- Background: glass card style — `rgba(44,61,51,0.45)` + `blur(20px)` + border `1px rgba(116,149,155,0.18)`
- Border radius: 20px
- Padding: 40px
- Shadow: `0 16px 48px rgba(0,0,0,0.40)`

### Card Content (top to bottom)
1. **Logo area**: Sentient logo mark (24px rounded square in primary) + "Sentient" 18px bold — centered
2. **Heading**: "Welcome back" — 24px bold, foreground
3. **Sub**: "Sign in to your reality engine" — 14px foreground-2
4. **Divider**: 24px spacer
5. **Google OAuth button**: full width, white/surface-1 bg, Google icon left, "Continue with Google" text, border `1px border-color`, 44px height, 10px radius
6. **Divider row**: `———  or  ———` in foreground-3
7. **Email input**: full width, label "Email" above, placeholder "you@company.com", glass input style (see design system)
8. **Password input**: full width, label "Password", eye toggle icon right, placeholder "••••••••"
9. **Row**: "Remember me" checkbox left + "Forgot password?" link right (primary color, 13px)
10. **Sign In button**: full width, primary button style (forest green), 44px height, "Sign In" text
11. **Bottom**: "Don't have an account? **Start free →**" — centered, 13px, link in primary color

### Light Mode Card
- Background: `rgba(255,255,255,0.80)` + blur(20px)
- Border: `1px #DDE6E0`
- Same structure, adjusted colors

---

## Page 2: Register (`/register`)

### Card (same glass card style, 480px)
1. Logo + "Sentient"
2. Heading: "Create your account"
3. Sub: "Start your free 14-day trial"
4. Google OAuth button (same as login)
5. Divider `———  or  ———`
6. **Full name input**: label "Full name", placeholder "Mohammad Habib"
7. **Work email input**: label "Work email", placeholder "you@company.com"
8. **Password input**: label "Password", strength indicator bar below (4 segments: empty→red→amber→green as user types)
9. **Terms row**: checkbox + "I agree to the Terms of Service and Privacy Policy" (links in primary color), 13px
10. **Create Account button**: full width, primary style
11. Bottom: "Already have an account? **Sign in →**"

---

## Page 3: Forgot Password (`/forgot-password`)

### Card (same glass style, 480px, but shorter)
1. **Back link**: "← Back to login" in foreground-2, top-left of card, 13px
2. **Icon**: lock icon in a glass circle (48px), centered
3. Heading: "Reset your password"
4. Sub: "Enter your email and we'll send you a reset link"
5. **Email input**: full width
6. **Send Reset Link button**: full width, primary style
7. Bottom: "Remember your password? **Sign in →**"

### Success State (after submitting)
- Replace form with:
- ✉ icon in green glass circle
- Heading: "Check your email"
- Sub: "We sent a reset link to **you@company.com**"
- "Resend email" ghost link below
- "Back to login" primary link

---

## Design Notes for All Auth Pages
- No harsh full-opacity backgrounds — everything has depth through glass + blur
- Inputs have focus state: primary color border + soft primary glow (`box-shadow: 0 0 0 3px rgba(116,149,155,0.15)`)
- Error states: red border + small red error text below input
- All forms work visually in both dark and light mode
- On mobile (375px): card fills full width with 16px padding

