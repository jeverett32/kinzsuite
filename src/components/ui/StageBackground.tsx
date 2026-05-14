import { PALETTE } from "@/lib/utils";

const GOLD_DEEP = "#C97A0C";
const GOLD = "#F2A627";
const GOLD_LIGHT = "#FFCE4D";
const RED_DEEP = "#8E1414";
const RED = "#D62525";
const RED_LIGHT = "#F25555";
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
            ${GOLD} 12px,
            ${GOLD_LIGHT} 22px,
            ${GOLD} 32px,
            ${GOLD_DEEP} 44px)`,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="curtain-left" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} />
            <stop offset="20%" stopColor={RED} />
            <stop offset="45%" stopColor={RED_LIGHT} />
            <stop offset="70%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
          <linearGradient id="curtain-right" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} />
            <stop offset="20%" stopColor={RED} />
            <stop offset="45%" stopColor={RED_LIGHT} />
            <stop offset="70%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
          <linearGradient id="valance" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={RED_LIGHT} />
            <stop offset="60%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
        </defs>

        <path
          d="M 0 0 L 100 0 L 100 14 Q 92 22, 84 14 Q 76 24, 68 14 Q 60 24, 52 14 Q 44 24, 36 14 Q 28 24, 20 14 Q 12 22, 4 14 L 0 14 Z"
          fill="url(#valance)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />

        <path
          d="M 0 0 L 28 0 Q 26 18, 24 38 Q 28 56, 22 72 Q 26 84, 18 95 L 0 95 Z"
          fill="url(#curtain-left)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 100 0 L 72 0 Q 74 18, 76 38 Q 72 56, 78 72 Q 74 84, 82 95 L 100 95 Z"
          fill="url(#curtain-right)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />

        <path d="M 4 6 Q 6 26, 4 50 Q 7 70, 3 90" stroke={RED_DEEP} strokeWidth={0.4} fill="none" opacity={0.7} />
        <path d="M 10 6 Q 12 26, 10 50 Q 13 70, 9 90" stroke={RED_LIGHT} strokeWidth={0.3} fill="none" opacity={0.6} />
        <path d="M 18 6 Q 20 26, 18 50 Q 21 70, 17 90" stroke={RED_DEEP} strokeWidth={0.4} fill="none" opacity={0.5} />
        <path d="M 96 6 Q 94 26, 96 50 Q 93 70, 97 90" stroke={RED_DEEP} strokeWidth={0.4} fill="none" opacity={0.7} />
        <path d="M 90 6 Q 88 26, 90 50 Q 87 70, 91 90" stroke={RED_LIGHT} strokeWidth={0.3} fill="none" opacity={0.6} />
        <path d="M 82 6 Q 80 26, 82 50 Q 79 70, 83 90" stroke={RED_DEEP} strokeWidth={0.4} fill="none" opacity={0.5} />
      </svg>

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "24%",
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
              transparent 26px,
              ${WOOD_DARK} 26px,
              ${WOOD_DARK} 28px)`,
            opacity: 0.55,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(90deg,
              transparent 0px,
              transparent 84px,
              ${WOOD_DARK} 84px,
              ${WOOD_DARK} 86px,
              transparent 86px,
              transparent 168px)`,
            opacity: 0.35,
          }}
        />
      </div>
    </div>
  );
}
