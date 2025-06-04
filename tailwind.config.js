module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#60a5fa',      // blue-400
          DEFAULT: '#3b82f6',   // blue-500
          dark: '#2563eb',      // blue-600
        },
        secondary: {
          light: '#93c5fd',     // blue-300
          DEFAULT: '#60a5fa',    // blue-400
          dark: '#3b82f6',       // blue-500
        },
      },
    },
  },
  plugins: [],
}