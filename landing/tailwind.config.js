/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        deck: {
          pitch: '#000000',
          surface: '#08080a',
          elevated: '#0f0f13',
          border: '#18181f',
          subtle: '#262630',
        },
      },
    },
  },
  plugins: [],
}
