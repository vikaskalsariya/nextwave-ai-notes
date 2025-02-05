/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter-sans)'],
      },
      animation: {
        'pencil-write': 'pencilWrite 1.5s infinite',
      },
      keyframes: {
        pencilWrite: {
          '0%, 100%': { transform: 'rotate(0deg) translate(0, 0)' },
          '25%': { transform: 'rotate(-10deg) translate(-2px, -2px)' },
          '50%': { transform: 'rotate(10deg) translate(2px, 2px)' },
          '75%': { transform: 'rotate(-5deg) translate(-1px, -1px)' },
        }
      }
    },
  },
  plugins: [],
}
