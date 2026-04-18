/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pk-bg-primary': 'var(--color-bg-primary)',
        'pk-bg-secondary': 'var(--color-bg-secondary)',
        'pk-surface': 'var(--color-surface)',
        'pk-accent': 'var(--color-accent)',
        'pk-primary': 'var(--color-primary)',
        'pk-secondary': 'var(--color-secondary)',
        'pk-tertiary': 'var(--color-tertiary)',
        'pk-neutral': 'var(--color-neutral)',
        'pk-text-main': 'var(--color-text-main)',
        'pk-text-muted': 'var(--color-text-muted)',
        'pk-success': 'var(--color-success)',
        'pk-warning': 'var(--color-warning)',
        'pk-error': 'var(--color-error)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      fontSize: {
        base: '13px',
      }
    },
  },
  plugins: [],
}
