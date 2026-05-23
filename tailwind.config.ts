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
          50:  '#e6f7ff',
          100: '#bae6ff',
          500: '#0077B6',
          600: '#005f99',
          700: '#004d80',
          900: '#0A1628',
        },
        success: { 500: '#059669', 100: '#DCFCE7' },
        warning: { 500: '#B45309', 100: '#FEF3C7' },
        danger:  { 500: '#B91C1C', 100: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
