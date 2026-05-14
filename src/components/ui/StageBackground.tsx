import { PALETTE } from "@/lib/utils";

const GOLD_DEEP = "#C97A0C";
const GOLD = "#F2A627";
const GOLD_LIGHT = "#FFCE4D";
const GOLD_PALE = "#FFE08A";
const RED_DEEP = "#7A0F0F";
const RED = "#C9201F";
const RED_LIGHT = "#F2625C";
const WOOD_DARK = "#6B3F12";
const WOOD = "#A66A2C";
const WOOD_LIGHT = "#C98C4D";

function RopeTie() {
  return (
    <svg viewBox="0 0 96 80" width={96} height={80}>
      <ellipse
        cx={88}
        cy={20}
        rx={7}
        ry={12}
        fill={GOLD_DEEP}
        stroke={PALETTE.ink}
        strokeWidth={1.5}
      />
      <path
        d="M 84 12 Q 90 16 88 22 M 84 18 Q 90 22 88 28 M 84 24 Q 90 28 88 34"
        stroke={GOLD_PALE}
        strokeWidth={1}
        fill="none"
        opacity={0.7}
      />

      <path
        d="M 2 12 Q 4 10 8 12 L 86 14 Q 92 16 92 22 L 90 28 Q 86 32 82 30 L 6 28 Q 2 26 2 22 Z"
        fill={GOLD}
        stroke={PALETTE.ink}
        strokeWidth={1.5}
      />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 6 + i * 6;
        return (
          <path
            key={i}
            d={`M ${x} 13 Q ${x + 3} 20 ${x} 28`}
            stroke={GOLD_DEEP}
            strokeWidth={1.1}
            fill="none"
          />
        );
      })}
      <path
        d="M 4 16 Q 44 14 86 18"
        stroke={GOLD_PALE}
        strokeWidth={1}
        fill="none"
        opacity={0.8}
      />

      <path
        d="M 44 28 Q 42 34 46 38 L 50 38 Q 54 34 52 28 Z"
        fill={GOLD}
        stroke={PALETTE.ink}
        strokeWidth={1.2}
      />
      <path
        d="M 40 38 L 38 64 M 44 38 L 43 70 M 48 38 L 49 70 M 52 38 L 54 64 M 56 38 L 58 60"
        stroke={GOLD_DEEP}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M 36 64 Q 48 72 60 64 L 58 70 Q 48 76 38 70 Z"
        fill={GOLD}
        stroke={PALETTE.ink}
        strokeWidth={1.2}
      />
    </svg>
  );
}

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
          <linearGradient id="drape-l-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} />
            <stop offset="30%" stopColor={RED} />
            <stop offset="70%" stopColor={RED_LIGHT} />
            <stop offset="100%" stopColor={RED} />
          </linearGradient>
          <linearGradient id="drape-r-grad" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} />
            <stop offset="30%" stopColor={RED} />
            <stop offset="70%" stopColor={RED_LIGHT} />
            <stop offset="100%" stopColor={RED} />
          </linearGradient>
        </defs>

        <path
          d="M 0 0
             L 50 0
             Q 44 8 36 18
             Q 24 28 14 38
             Q 4 46 4 52
             Q 6 64 10 78
             Q 14 88 16 96
             L 0 96 Z"
          fill="url(#drape-l-grad)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 6 4 Q 22 18 18 34 Q 10 46 12 54 Q 14 68 14 86"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 14 4 Q 28 18 24 34 Q 16 46 16 54 Q 17 70 16 88"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 24 4 Q 34 18 30 32"
          stroke={RED_DEEP}
          strokeWidth={0.35}
          fill="none"
          opacity={0.35}
        />
        <path
          d="M 10 4 Q 24 16 22 30"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.55}
        />

        <path
          d="M 100 0
             L 50 0
             Q 56 8 64 18
             Q 76 28 86 38
             Q 96 46 96 52
             Q 94 64 90 78
             Q 86 88 84 96
             L 100 96 Z"
          fill="url(#drape-r-grad)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 94 4 Q 78 18 82 34 Q 90 46 88 54 Q 86 68 86 86"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 86 4 Q 72 18 76 34 Q 84 46 84 54 Q 83 70 84 88"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 76 4 Q 66 18 70 32"
          stroke={RED_DEEP}
          strokeWidth={0.35}
          fill="none"
          opacity={0.35}
        />
        <path
          d="M 90 4 Q 76 16 78 30"
          stroke={RED_LIGHT}
          strokeWidth={0.3}
          fill="none"
          opacity={0.55}
        />
      </svg>

      <div className="absolute" style={{ top: "46%", left: "-2%" }}>
        <RopeTie />
      </div>
      <div className="absolute" style={{ top: "46%", right: "-2%", transform: "scaleX(-1)" }}>
        <RopeTie />
      </div>

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
