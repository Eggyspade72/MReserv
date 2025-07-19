<<<<<<< HEAD
=======
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        neutral: {
          100: '#F3F4F6',
          200: '#E5E7EB',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      }
    }
  },
  plugins: [],
}

