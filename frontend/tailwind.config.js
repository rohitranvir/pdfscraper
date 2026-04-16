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
      },
      colors: {
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
          fast:        '#10b981',  // emerald
          manual:      '#f59e0b',  // amber
          specialist:  '#3b82f6',  // blue
          flag:        '#ef4444',  // red
          standard:    '#8b5cf6',  // violet
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.45s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
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
  plugins: [],
}
