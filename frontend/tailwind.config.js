/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',
          glass: 'rgba(30, 41, 59, 0.7)',
          accent: '#6366f1',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
          textMuted: '#94a3b8',
          textActive: '#f8fafc'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
