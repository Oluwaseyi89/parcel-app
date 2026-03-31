/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF9500",
        secondary: "#1E1E1E",
        red: "#FF0000",
        warning: "#FFC107",
        success: "#28A745",
        info: "#17A2B8",
        danger: "#DC3545",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      spacing: {
        "128": "32rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
