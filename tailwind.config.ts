import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        milestone: {
          navy: "#07111F",
          sidebar: "#0B1929",
          blue: "#1769FF",
          "blue-dim": "#EEF3FF",
          green: "#36A852",
          "green-dim": "#E8F5EC",
          amber: "#F8B400",
          "amber-dim": "#FFF8E1",
          red: "#EA4335",
          "red-dim": "#FEE8E6",
          bg: "#F8FAFC",
          line: "#E8EDF3",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04)",
        "card-lg": "0 4px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
        "card-xl": "0 8px 24px rgba(15,23,42,0.08), 0 2px 6px rgba(15,23,42,0.04)",
        "blue-glow": "0 2px 12px rgba(23,105,255,0.2)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.2s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
