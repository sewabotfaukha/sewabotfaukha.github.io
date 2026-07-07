import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#0a0e1a", // dark navy-black utama
          surface: "#10162a", // sedikit lebih terang, untuk card/section
          elevated: "#161d33", // untuk elemen yang butuh elevasi lebih
        },
        whatsapp: {
          DEFAULT: "#25D366",
          dark: "#1da851",
        },
        telegram: {
          DEFAULT: "#0088cc",
          dark: "#006ba1",
        },
        aitech: {
          from: "#7C3AED", // ungu
          to: "#06B6D4", // cyan
        },
        foreground: {
          DEFAULT: "#F5F7FA",
          muted: "#94A3B8",
          subtle: "#64748B",
        },
        border: {
          DEFAULT: "#1F2740",
        },
      },
      fontFamily: {
        heading: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-aitech": "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
        "gradient-radial-glow":
          "radial-gradient(circle at center, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow: "0 0 20px 0 rgba(124,58,237,0.35)",
          },
          "50%": {
            boxShadow: "0 0 40px 5px rgba(6,182,212,0.45)",
          },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
