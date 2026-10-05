import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutrals
        "ivory-cream": "#FAF8F5",
        "ivory-warm": "#F5F1EA",
        parchment: "#EDE8DF",
        "sand-light": "#E5DFD3",
        sand: "#D4CBBF",
        taupe: "#B8AEA0",
        greige: "#9A8F82",
        stone: "#7A7068",
        "charcoal-warm": "#4A453D",
        "charcoal-deep": "#2D2A26",
        noir: "#1A1816",
        // Accents
        "gold-soft": "#C9A962",
        "gold-muted": "#B89B4A",
        "gold-deep": "#9A7F35",
        champagne: "#E8DCC4",
        "bronze-whisper": "#A8927A",
        "sapphire-mist": "#4A5568",
        "sapphire-subtle": "#5C6B7A",
        "sapphire-deep": "#2C3E50",
        "azure-whisper": "#E8ECF0",
        // Semantic
        "maritime-success": "#4A6347",
        "maritime-success-soft": "#6B8068",
        "maritime-warning": "#A68B3D",
        "maritime-warning-soft": "#C4A35A",
        "maritime-error": "#8B5252",
        "maritime-error-soft": "#A67272",
        "maritime-info": "#4A5A6A",
        "maritime-info-soft": "#6B7A8A",
        // Surfaces
        background: "#FAF8F5",
        foreground: "#1A1816",
        // Voyage Intelligence (dark surface, scoped via [data-surface="voyage"])
        voyage: {
          bg: "#0B0F17",
          elevated: "#11161F",
          sunken: "#080B11",
          border: "rgba(255,255,255,0.10)",
          "border-2": "rgba(255,255,255,0.06)",
          "border-strong": "rgba(255,255,255,0.16)",
          text: "#F2F4F8",
          "text-2": "#A4ACBA",
          "text-3": "#6B7280",
          "text-4": "#4A5263",
          accent: "#3B82F6",
          "accent-hover": "#5B97F8",
          "accent-soft": "rgba(59,130,246,0.12)",
          "accent-line": "rgba(59,130,246,0.32)",
          ok: "#10B981",
          warn: "#F59E0B",
          danger: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        "hero": ["clamp(3.5rem, 7vw, 6rem)", { lineHeight: "0.9", letterSpacing: "-0.03em" }],
        "section": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "stat": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.02em" }],
      },
      boxShadow: {
        "sm": "0 1px 2px rgba(26, 24, 22, 0.04)",
        "md": "0 4px 12px rgba(26, 24, 22, 0.06)",
        "lg": "0 12px 32px rgba(26, 24, 22, 0.08)",
        "xl": "0 24px 64px rgba(26, 24, 22, 0.12)",
        "gold": "0 0 24px rgba(184, 155, 74, 0.15)",
        "gold-lg": "0 0 48px rgba(184, 155, 74, 0.20)",
        "inner-gold": "inset 0 1px 0 rgba(201, 169, 98, 0.15)",
      },
      backgroundImage: {
        "ivory-flow": "linear-gradient(135deg, #FAF8F5 0%, #EDE8DF 100%)",
        "gold-whisper": "linear-gradient(135deg, #E8DCC4 0%, #C9A962 100%)",
        "intelligence-depth": "linear-gradient(180deg, #2C3E50 0%, #4A5568 100%)",
        "noir-editorial": "linear-gradient(135deg, #1A1816 0%, #2D2A26 50%, #4A453D 100%)",
        "sidebar-texture": "linear-gradient(135deg, #2D2A26 0%, #1A1816 100%)",
        "gold-aura": "linear-gradient(180deg, rgba(201, 169, 98, 0.08) 0%, rgba(250, 248, 245, 0) 100%)",
        "ocean-gradient": "linear-gradient(180deg, #EDE8DF 0%, #E5DFD3 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "ticker": "ticker 40s linear infinite",
        "shimmer": "shimmer 1.5s infinite",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(184, 155, 74, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(184, 155, 74, 0)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      spacing: {
        "sidebar": "280px",
        "topbar": "72px",
        "statusbar": "40px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
