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
        // Sentient brand tokens (dynamic CSS variables)
        'mist-teal':    'hsl(var(--primary))',
        'forest-green': 'hsl(var(--secondary))',
        'deep-forest':  '#2C3D33',
        'glass-border': 'var(--glass-border)',
        'glass-fill':   'var(--glass-bg)',
        'topbar-bg':    'var(--topbar-bg)',
        'amber-alert':  'hsl(var(--amber))',
        'error-red':    'hsl(var(--red))',
        // Semantic standard colors mapped to HSL variables
        green:          'hsl(var(--green))',
        amber:          'hsl(var(--amber))',
        red:            'hsl(var(--red))',
        // Surface / on-surface tokens (dynamic CSS variables)
        'surface-container':        'var(--surface-container)',
        'surface-container-low':    'var(--surface-container-low)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'on-surface':               'var(--on-surface)',
        'on-surface-variant':       'var(--on-surface-variant)',
        'outline-variant':          'var(--outline-variant)',
      },
      spacing: {
        'gutter':        '1.5rem',
        'container-max': '1280px',
      },
      fontSize: {
        'hero-900':     ['72px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '900' }],
        'label-caps':   ['11px', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '600' }],
        'metric-lg':    ['18px', { lineHeight: '1', fontWeight: '500' }],
        'mono-xs':      ['11px', { lineHeight: '1', fontWeight: '400' }],
        'body-lg':      ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'headline-2xl': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Menlo', 'monospace'],
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
