import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        slateBrand: "#0f172a",
        advisorBlue: "#1d4ed8",
        success: "#15803d",
        danger: "#b91c1c",
        warning: "#b45309"
      },
      boxShadow: {
        premium: "0 12px 34px -18px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
