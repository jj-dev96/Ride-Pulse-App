/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FFD700",
        secondary: "#FF0000",
        background: {
          light: "#F3F4F6",
          dark: "#111827",
        },
        card: {
          light: "#FFFFFF",
          dark: "#1F2937",
        },
      },
    },
  },
  plugins: [],
}
