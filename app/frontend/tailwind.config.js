/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2c5aa0",
          dark: "#1e3f73",
          light: "#d9e2f3",
        },
        gold: "#FFD700",
        silver: "#C0C0C0",
        bronze: "#CD7F32",
      },
    },
  },
  plugins: [],
};
