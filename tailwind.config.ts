import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102a43",
        paper: "#fbf8f2",
        brand: {
          50: "#eef7f1",
          100: "#d9ede0",
          200: "#b8ddc7",
          300: "#90c8a5",
          400: "#63af7e",
          500: "#459461",
          600: "#33744b",
          700: "#285c3c",
          800: "#214a32",
          900: "#1c3d2a"
        },
        sand: {
          50: "#f9f4eb",
          100: "#f1e5cf",
          200: "#e6d1ab",
          300: "#d5b47a",
          400: "#c89a54",
          500: "#b6813b"
        }
      },
      fontFamily: {
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "Georgia", "serif"]
      },
      boxShadow: {
        soft: "0 20px 60px -30px rgba(16, 42, 67, 0.28)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;
