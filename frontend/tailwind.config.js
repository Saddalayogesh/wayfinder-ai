/** @type {import('tailwindcss').Config} */
export default {
  // 'class' strategy: the ThemeProvider toggles `dark`/`light` on <html>.
  // Both palettes live in the same CSS-var tokens (see index.css), so `dark:`
  // variants are only needed for rare mode-specific details (e.g. shadows).
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // UI / body — everything except hero-level headings.
        sans: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Display serif — reserved for H1/H2 hero & section headings only.
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // ---- Design system palette (single source of truth) ----
        // Values are RGB triplets defined as CSS variables in index.css:
        //   :root { --color-background: 7 11 23; }        (dark)
        //   html.light { --color-background: 246 245 251; } (light)
        // Tailwind's <alpha-value> keeps opacity modifiers (bg-background/40)
        // working in both themes.
        background: 'rgb(var(--color-background) / <alpha-value>)', // warm cream page
        surface: 'rgb(var(--color-surface) / <alpha-value>)', // cards, panels, nav, modals
        'surface-hover': 'rgb(var(--color-surface-hover) / <alpha-value>)', // hover fills, inputs
        border: 'rgb(var(--color-border) / <alpha-value>)', // soft beige hairlines
        primary: 'rgb(var(--color-primary) / <alpha-value>)', // warm taupe — buttons, focus
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)', // deep taupe hover
        accent: 'rgb(var(--color-accent) / <alpha-value>)', // dusty rose — links, highlights
        blush: 'rgb(var(--color-blush) / <alpha-value>)', // soft blush secondary bg
        peach: 'rgb(var(--color-peach) / <alpha-value>)', // soft peach secondary accent
        gold: 'rgb(var(--color-gold) / <alpha-value>)', // rose gold — premium accents
        success: 'rgb(var(--color-success) / <alpha-value>)', // muted sage — positive states
        error: 'rgb(var(--color-error) / <alpha-value>)', // soft terracotta — errors, destructive
        text: 'rgb(var(--color-text) / <alpha-value>)', // charcoal primary text
        muted: 'rgb(var(--color-muted) / <alpha-value>)', // warm gray secondary text
        // Warnings still reuse Tailwind's built-in amber.
      },
      boxShadow: {
        // Soft terracotta glow for the primary CTA and focused cards — derived
        // from the active theme's primary token at runtime.
        glow: '0 12px 32px -12px rgb(var(--color-primary) / 0.45)',
        'glow-sm': '0 6px 20px -8px rgb(var(--color-primary) / 0.4)',
        panel: '0 20px 60px -20px rgb(0 0 0 / 0.6)',
        // Luxe hover treatment for image cards — deep, diffused, warm-tinted.
        luxe: '0 24px 60px -18px rgb(var(--color-primary) / 0.3)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Slow ambient drift for the hero's gradient orbs.
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(4%, -6%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-5%, 4%, 0) scale(0.94)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        'fade-in-up': 'fade-in-up 600ms ease-out both',
        'modal-in': 'modal-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
