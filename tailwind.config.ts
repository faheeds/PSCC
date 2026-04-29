import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d1f3c",
        paper: "#f4f7fb",
        navy: {
          50:  "#e8edf5",
          100: "#ccd6f6",
          200: "#9aadc9",
          300: "#8892b0",
          400: "#6b7a99",
          500: "#4d5e7a",
          600: "#2c527e",
          700: "#1e3a5f",
          800: "#112240",
          900: "#0d1f3c",
        },
        forest: {
          50:  "#e8f5ee",
          100: "#c5e3d1",
          200: "#95ccb0",
          300: "#74c69d",
          400: "#52b788",
          500: "#2d9e6e",
          600: "#2d6a4f",
          700: "#1b4332",
          800: "#143326",
          900: "#0a2218",
        },
        brand: {
          50:  "#e8f5ee",
          100: "#c5e3d1",
          200: "#95ccb0",
          300: "#52b788",
          400: "#2d9e6e",
          500: "#1b7a52",
          600: "#2d6a4f",
          700: "#1b4332",
          800: "#143326",
          900: "#0d2218",
        },
        sand: {
          50: "#f9f4eb",
          100: "#f1e5cf",
        },
        mint: "#74c69d",
        sage: "#52b788",
        surface: {
          50:  "#f4f7fb",
          100: "#dde5f0",
          200: "#c5d0e3",
        },
      },
      fontFamily: {
        body:    ["var(--font-body)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        app: "14px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(13,31,60,0.10)",
        soft: "0 20px 60px -20px rgba(13,31,60,0.22)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
