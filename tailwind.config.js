/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'flash-green': 'flashGreen 1.5s ease-out forwards',
        'flash-red': 'flashRed 1.5s ease-out forwards',
        'flow-dash': 'flow 20s linear infinite',
      },
      keyframes: {
        flashGreen: {
          '0%': { borderColor: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.6)', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
          '100%': { borderColor: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none', backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { borderColor: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)', backgroundColor: 'rgba(239, 68, 68, 0.15)' },
          '100%': { borderColor: 'rgba(255, 255, 255, 0.08)', boxShadow: 'none', backgroundColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
