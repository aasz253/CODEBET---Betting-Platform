/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#1A1A1A',
        primary: '#FFD700',
        secondary: '#00FF00',
        danger: '#FF0000',
      }
    },
  },
  plugins: [],
}
