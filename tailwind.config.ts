import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-lilita)", "Fredoka", "system-ui", "sans-serif"],
        body: ["var(--font-fredoka)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "cursive"],
      },
      colors: {
        ink: "#13294B",
        sky: "#3FB8E8",
        sun: "#FFC93C",
        grass: "#7BC043",
        blush: "#FF6FA3",
        purple: "#A05CFF",
        cream: "#EAF6FF",
      },
      boxShadow: {
        chunky: "0 4px 0 0 #13294B",
        sticker:
          "inset 0 0 0 3px rgba(255,255,255,0.6), 0 6px 0 -1px #13294B, 0 14px 24px -8px rgba(19,41,75,0.4)",
      },
      keyframes: {
        drift: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(40px)" },
        },
        beat: {
          "0%,100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.18)" },
        },
      },
      animation: {
        drift: "drift 14s ease-in-out infinite alternate",
        beat: "beat .5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
