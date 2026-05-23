import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:       '#EFF6FF',
          100:      '#DBEAFE',
          200:      '#BFDBFE',
          300:      '#93C5FD',
          400:      '#60A5FA',
          500:      '#2563EB',   // spec: was #0077B6
          600:      '#1D4ED8',
          700:      '#1E40AF',
          800:      '#1E3A8A',
          900:      '#0F172A',   // spec: was #0A1628
          yellow:   '#FACC15',   // NEW: energy/highlight accent
          charcoal: '#1E293B',   // NEW: secondary surface
        },
        success: { 500: '#22C55E', 100: '#DCFCE7' },
        warning: { 500: '#F97316', 100: '#FFF7ED' },
        danger:  { 500: '#EF4444', 100: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['2rem',    { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['1.5rem',  { lineHeight: '1.3', fontWeight: '600' }],
        'subhead': ['1.125rem',{ lineHeight: '1.4', fontWeight: '600' }],
        'body':    ['0.875rem',{ lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],
        'code':    ['0.8125rem',{ lineHeight: '1.5', fontWeight: '500' }],
      },
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
        'btn':      '0 1px 2px rgba(37,99,235,0.2)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '100%': { transform: 'scale(2.4)',  opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        shimmer:        'shimmer 1.5s infinite linear',
        'count-up':     'count-up 0.4s cubic-bezier(0,0,0.2,1)',
        'slide-in':     'slide-in-right 0.3s cubic-bezier(0,0,0.2,1)',
        'slide-down':   'slide-down 0.2s cubic-bezier(0,0,0.2,1)',
        'pulse-ring':   'pulse-ring 1.2s cubic-bezier(0.215,0.61,0.355,1) infinite',
        'fade-in':      'fade-in 0.25s ease-in',
      },
      transitionTimingFunction: {
        'entrance': 'cubic-bezier(0,0,0.2,1)',
        'exit':     'cubic-bezier(0.4,0,1,1)',
        'spring':   'cubic-bezier(0.175,0.885,0.32,1.275)',
      },
    },
  },
  plugins: [],
}

export default config
