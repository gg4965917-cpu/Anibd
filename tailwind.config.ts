import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f5c518",
          dim: "#d4a80f",
        },
        surface: {
          DEFAULT: "#0b1220",
          raised: "#111a2e",
          ring: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245, 197, 24, 0.35), 0 10px 30px -10px rgba(245, 197, 24, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
