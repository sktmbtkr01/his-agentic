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
        // ==========================================
        // SEMANTIC COLORS (Mapped to CSS Variables)
        // ==========================================
        
        // Background colors
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          secondary: 'rgb(var(--color-surface-secondary) / <alpha-value>)',
          highlight: 'rgb(var(--color-surface-highlight) / <alpha-value>)',
          elevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        },
        input: 'rgb(var(--color-input) / <alpha-value>)',
        
        // Text colors
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-disabled': 'rgb(var(--color-text-disabled) / <alpha-value>)',
        'text-inverse': 'rgb(var(--color-text-inverse) / <alpha-value>)',
        
        // Border colors
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          secondary: 'rgb(var(--color-border-secondary) / <alpha-value>)',
          focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
        },
        
        // Primary color (global)
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        },
        
        // Role-specific color (dynamically set via data-role attribute)
        role: {
          DEFAULT: 'rgb(var(--color-role) / <alpha-value>)',
          hover: 'rgb(var(--color-role-hover) / <alpha-value>)',
          light: 'rgb(var(--color-role-light) / <alpha-value>)',
          dark: 'rgb(var(--color-role-dark) / <alpha-value>)',
        },
        
        // Accent color
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
        },
        
        // Status colors
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        error: 'rgb(var(--color-error) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        
        // ==========================================
        // ROLE THEME COLORS (Direct values for explicit use)
        // ==========================================
        doctor: {
          DEFAULT: '#06b6d4',  // Cyan-500
          light: '#a5f3fc',    // Cyan-200
          dark: '#0e7490',     // Cyan-700
        },
        nurse: {
          DEFAULT: '#ec4899',  // Pink-500
          light: '#fbcfe8',    // Pink-200
          dark: '#be185d',     // Pink-700
        },
        admin: {
          DEFAULT: '#8b5cf6',  // Violet-500
          light: '#ddd6fe',    // Violet-200
          dark: '#6d28d9',     // Violet-700
        },
        lab: {
          DEFAULT: '#10b981',  // Emerald-500
          light: '#a7f3d0',    // Emerald-200
          dark: '#047857',     // Emerald-700
        },
        radiologist: {
          DEFAULT: '#f59e0b',  // Amber-500
          light: '#fde68a',    // Amber-200
          dark: '#b45309',     // Amber-700
        },
        pharmacist: {
          DEFAULT: '#3b82f6',  // Blue-500
          light: '#bfdbfe',    // Blue-200
          dark: '#1d4ed8',     // Blue-700
        },
        receptionist: {
          DEFAULT: '#7c3aed',  // Violet-600
          light: '#ddd6fe',    // Violet-200
          dark: '#5b21b6',     // Violet-800
        },
        billing: {
          DEFAULT: '#14b8a6',  // Teal-500
          light: '#99f6e4',    // Teal-200
          dark: '#0f766e',     // Teal-700
        },
        
        // Keep existing for backward compatibility
        card: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: '#64748B',
          dark: '#0F172A',
          muted: '#94A3B8',
        },
        textPrimary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      
      borderRadius: {
        '4xl': '2rem',
      },
      
      boxShadow: {
        // Theme-aware shadows
        'theme-sm': '0 1px 2px rgb(var(--shadow-color) / var(--shadow-opacity))',
        'theme-md': '0 4px 6px -1px rgb(var(--shadow-color) / var(--shadow-opacity))',
        'theme-lg': '0 10px 15px -3px rgb(var(--shadow-color) / var(--shadow-opacity))',
        'theme-xl': '0 20px 25px -5px rgb(var(--shadow-color) / var(--shadow-opacity))',
        
        // Role-colored shadows
        'role': '0 4px 14px rgb(var(--color-role) / 0.25)',
        'role-lg': '0 10px 25px rgb(var(--color-role) / 0.3)',
        'role-glow': '0 0 20px rgb(var(--color-role) / 0.4)',
        
        // Existing shadows
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'soft-xl': '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(20, 184, 166, 0.5)',
        
        // Inner shadows for depth
        'inner-sm': 'inset 0 1px 2px rgb(var(--shadow-color) / 0.05)',
        'inner-md': 'inset 0 2px 4px rgb(var(--shadow-color) / 0.1)',
      },
      
      backgroundImage: {
        // Role gradient (uses CSS variable)
        'gradient-role': 'var(--gradient-role)',
        'gradient-role-subtle': 'var(--gradient-role-subtle)',
        
        // Static gradients
        'gradient-hero': 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
        'gradient-text': 'linear-gradient(135deg, #0F172A 0%, #14B8A6 100%)',
        
        // Role-specific gradients (for explicit use)
        'gradient-doctor': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        'gradient-nurse': 'linear-gradient(135deg, #ec4899, #f472b6)',
        'gradient-admin': 'linear-gradient(135deg, #8b5cf6, #a855f7)',
        'gradient-lab': 'linear-gradient(135deg, #10b981, #22c55e)',
        'gradient-radiologist': 'linear-gradient(135deg, #f59e0b, #f97316)',
        'gradient-pharmacist': 'linear-gradient(135deg, #3b82f6, #6366f1)',
        'gradient-receptionist': 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
        'gradient-billing': 'linear-gradient(135deg, #14b8a6, #06b6d4)',
        
        // Dark mode gradients
        'gradient-dark': 'linear-gradient(135deg, #171717, #262626)',
        'gradient-dark-subtle': 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0))',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'marquee': 'marquee 25s linear infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
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
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgb(var(--color-role) / 0.3)' },
          '50%': { boxShadow: '0 0 30px rgb(var(--color-role) / 0.5)' },
        },
      },
      
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  plugins: [],
}
