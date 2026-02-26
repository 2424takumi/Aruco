/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#FAF8F5",
          100: "#F5F0EB",
          200: "#EBE3D9",
          300: "#DDD2C3",
          400: "#C4B5A0",
          500: "#A89880",
        },
        forest: {
          50: "#F0F5F2",
          100: "#D9E8DF",
          200: "#B3D1BF",
          300: "#8DB99F",
          400: "#7C9A8E",
          500: "#5A7A6B",
          600: "#3D5C4D",
          700: "#2D4438",
          800: "#1E2D25",
        },
        warm: {
          50: "#FFF8F0",
          100: "#FFEDD5",
          200: "#FED7AA",
        },
      },
    },
  },
  plugins: [],
};
