import { PALETTE } from "@/lib/utils";

const GOLD_DEEP = "#C97A0C";
const GOLD = "#F2A627";
const GOLD_LIGHT = "#FFCE4D";
const RED_DEEP = "#7A0F0F";
const RED = "#C9201F";
const RED_MID = "#E33C3C";
const RED_LIGHT = "#F2625C";
const WOOD_DARK = "#6B3F12";
const WOOD = "#A66A2C";
const WOOD_LIGHT = "#C98C4D";

export function StageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(90deg,
            ${GOLD_DEEP} 0px,
            ${GOLD} 14px,
            ${GOLD_LIGHT} 26px,
            ${GOLD} 38px,
            ${GOLD_DEEP} 50px)`,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="drape-l-main" cx="0.3" cy="0.5" r="1">
            <stop offset="0%" stopColor={RED_LIGHT} />
            <stop offset="55%" stopColor={RED_MID} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </radialGradient>
          <radialGradient id="drape-r-main" cx="0.7" cy="0.5" r="1">
            <stop offset="0%" stopColor={RED_LIGHT} />
            <stop offset="55%" stopColor={RED_MID} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </radialGradient>
          <linearGradient id="valance-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={RED_LIGHT} />
            <stop offset="60%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
        </defs>

        <path
          d="M 0 0
             L 38 0
             Q 34 8, 32 18
             Q 38 24, 30 30
             Q 36 40, 28 48
             Q 34 58, 26 64
             Q 32 76, 22 82
             Q 28 92, 18 96
             L 0 96 Z"
          fill="url(#drape-l-main)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 6 6 Q 10 22, 6 40 Q 12 56, 4 76 Q 10 92, 2 96"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 14 6 Q 18 22, 14 40 Q 20 56, 12 76 Q 18 92, 10 96"
          stroke={RED_DEEP}
          strokeWidth={0.45}
          fill="none"
          opacity={0.55}
        />
        <path
          d="M 22 6 Q 26 22, 22 40 Q 28 56, 20 76 Q 26 92, 18 96"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.45}
        />
        <path
          d="M 4 6 Q 8 22, 4 40 Q 10 56, 2 76"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 12 6 Q 16 22, 12 40 Q 18 56, 10 76"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.4}
        />

        <path
          d="M 100 0
             L 62 0
             Q 66 8, 68 18
             Q 62 24, 70 30
             Q 64 40, 72 48
             Q 66 58, 74 64
             Q 68 76, 78 82
             Q 72 92, 82 96
             L 100 96 Z"
          fill="url(#drape-r-main)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 94 6 Q 90 22, 94 40 Q 88 56, 96 76 Q 90 92, 98 96"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 86 6 Q 82 22, 86 40 Q 80 56, 88 76 Q 82 92, 90 96"
          stroke={RED_DEEP}
          strokeWidth={0.45}
          fill="none"
          opacity={0.55}
        />
        <path
          d="M 78 6 Q 74 22, 78 40 Q 72 56, 80 76 Q 74 92, 82 96"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.45}
        />
        <path
          d="M 96 6 Q 92 22, 96 40 Q 90 56, 98 76"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 88 6 Q 84 22, 88 40 Q 82 56, 90 76"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.4}
        />

        <path
          d="M 0 0
             L 100 0
             L 100 12
             Q 92 22, 84 12
             Q 76 22, 68 12
             Q 60 22, 52 12
             Q 44 22, 36 12
             Q 28 22, 20 12
             Q 12 22, 4 12
             L 0 12 Z"
          fill="url(#valance-grad)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 0 11 Q 8 18, 16 11 Q 24 18, 32 11 Q 40 18, 48 11 Q 56 18, 64 11 Q 72 18, 80 11 Q 88 18, 96 11"
          stroke={GOLD_LIGHT}
          strokeWidth={0.4}
          fill="none"
        />
      </svg>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "38%",
          background: `linear-gradient(180deg, ${WOOD_DARK} 0%, ${WOOD} 35%, ${WOOD_LIGHT} 100%)`,
          borderTop: `3px solid ${PALETTE.ink}`,
          boxShadow: `inset 0 8px 16px rgba(0,0,0,0.3)`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(180deg,
              transparent 0px,
              transparent 22px,
              ${WOOD_DARK} 22px,
              ${WOOD_DARK} 24px)`,
            opacity: 0.6,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(90deg,
              transparent 0px,
              transparent 72px,
              ${WOOD_DARK} 72px,
              ${WOOD_DARK} 74px,
              transparent 74px,
              transparent 148px)`,
            opacity: 0.35,
          }}
        />
      </div>
    </div>
  );
}
