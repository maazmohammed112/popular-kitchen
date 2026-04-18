/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pk-bg-primary': '#0A1628',
        'pk-bg-secondary': '#0F2040',
        'pk-surface': '#152847',
        'pk-accent': '#1E90FF',
        'pk-text-main': '#F5F0E8',
        'pk-text-muted': '#8FA3BF',
        'pk-success': '#00C896',
        'pk-warning': '#FFB347',
        'pk-error': '#FF4757',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        base: '13px',
      }
    },
  },
  plugins: [],
}
