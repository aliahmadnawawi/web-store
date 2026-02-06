/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#038383",
        ink: "#333333",
        soft: "#F6F7FB",
        accent: "#FFB11A",
        danger: "#F04438"
      },
      boxShadow: {
        card: "0 10px 30px rgba(14, 71, 161, 0.10)",
      },
      borderRadius: {
        xl: "20px"
      }
    },
  },
  plugins: [],
};
