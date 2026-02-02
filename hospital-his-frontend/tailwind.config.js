/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic Colors (Mapped to CSS Variables)
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-highlight': 'rgb(var(--color-surface-highlight) / <alpha-value>)',

        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
          dark: '#0D9488',
          light: '#5EEAD4',
        },
        secondary: {
          DEFAULT: '#64748B',
          dark: '#0F172A',
          muted: '#94A3B8',
        },
        textPrimary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',

        // Keep existing mainly for backward capability until refactored
        card: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'soft-xl': '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(20, 184, 166, 0.5)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
        'gradient-text': 'linear-gradient(135deg, #0F172A 0%, #14B8A6 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
