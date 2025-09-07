/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
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
  // De 'plugins' array moet leeg zijn voor Tailwind v4
  plugins: [],
};