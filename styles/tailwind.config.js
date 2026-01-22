/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: '#ff2e63',
          secondary: '#08d9d6',
          dark: '#252a34',
          darker: '#1a1e25',
        },
      },
    },
    plugins: [],
  }