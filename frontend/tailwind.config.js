/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        critical: '#7a0d0d',
        high: '#c0392b',
        medium: '#d68910',
        low: '#2e86c1',
        info: '#7f8c8d',
      },
    },
  },
  plugins: [],
}

