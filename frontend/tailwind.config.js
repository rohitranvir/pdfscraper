/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        background: '#0a0d1c',
        surface: '#0a0d1c',
        'surface-container-low': '#0e1322',
        'surface-container': '#14192a',
        'surface-container-high': '#1a1f32',
        'surface-container-highest': '#1f253a',
        primary: '#bd9dff',
        'primary-dim': '#8a4cfc',
        'primary-container': '#b28cff',
        'on-primary': '#3c0089',
        secondary: '#7799ff',
        'secondary-dim': '#316bf3',
        tertiary: '#8ce7ff',
        'tertiary-container': '#53ddfc',
        'on-tertiary-container': '#004b58',
        'on-surface': '#e2e4f9',
        'on-surface-variant': '#a7aabe',
        error: '#ff6e84',
        'error-container': '#a70138',
        'on-error-container': '#ffb2b9',
        'outline-variant': '#444758',
        'surface-tint': '#bd9dff',
        
        // existing legacy fallback variables just in case
        navy: {
          950: '#020817',
          900: '#0a0f1e',
          800: '#0f1629',
          700: '#151d35',
          600: '#1a2340',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover:   '#2563eb',
          light:   '#60a5fa',
          glow:    'rgba(59,130,246,0.25)',
        },
        route: {
          fast:        '#10b981',  
          manual:      '#f59e0b',  
          specialist:  '#3b82f6',  
          flag:        '#ef4444',  
          standard:    '#8b5cf6',  
        },
      },
      backdropBlur: {
        xs: '2px',
        xl: '24px',
      },
      blur: {
        '120': '120px',
      },
      animation: {
        'fade-in':    'fadeIn 1s ease-out forwards',
        'slide-up':   'slideUp 0.45s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(59,130,246,0.35)',
        card:  '0 8px 32px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
