/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deck: {
          950: '#06090e',
          900: '#0b111a',
          850: '#101926',
          800: '#162233',
          700: '#23364f',
        },
      },
    },
  },
  plugins: [],
}
