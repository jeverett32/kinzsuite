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

function RopeKnot() {
  return (
    <svg viewBox="0 0 40 70" width={34} height={60}>
      <ellipse
        cx={20}
        cy={14}
        rx={17}
        ry={9}
        fill={GOLD}
        stroke={PALETTE.ink}
        strokeWidth={1.5}
      />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M ${4 + i * 5} 7 Q ${7 + i * 5} 14 ${4 + i * 5} 21`}
          stroke={GOLD_DEEP}
          strokeWidth={0.9}
          fill="none"
        />
      ))}
      <ellipse
        cx={20}
        cy={14}
        rx={17}
        ry={9}
        fill="none"
        stroke={GOLD_PALE}
        strokeWidth={0.6}
        opacity={0.7}
      />
      <circle cx={20} cy={28} r={3.5} fill={GOLD} stroke={PALETTE.ink} strokeWidth={1.2} />
      <path
        d="M 15 30 L 13 58 M 18 30 L 17 62 M 22 30 L 23 62 M 25 30 L 27 58"
        stroke={GOLD_DEEP}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <path
        d="M 12 58 Q 20 66 28 58 L 26 62 Q 20 68 14 62 Z"
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
             Q 8 62 18 74
             Q 28 86 30 96
             L 0 96 Z"
          fill="url(#drape-l-grad)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 6 4 Q 22 18 18 34 Q 10 46 12 54 Q 18 68 26 82 Q 30 92 26 96"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 14 4 Q 28 18 24 34 Q 16 46 18 54 Q 22 68 28 82"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 24 4 Q 34 18 30 34"
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
             Q 92 62 82 74
             Q 72 86 70 96
             L 100 96 Z"
          fill="url(#drape-r-grad)"
          stroke={PALETTE.ink}
          strokeWidth={0.3}
        />
        <path
          d="M 94 4 Q 78 18 82 34 Q 90 46 88 54 Q 82 68 74 82 Q 70 92 74 96"
          stroke={RED_DEEP}
          strokeWidth={0.5}
          fill="none"
          opacity={0.7}
        />
        <path
          d="M 86 4 Q 72 18 76 34 Q 84 46 82 54 Q 78 68 72 82"
          stroke={RED_DEEP}
          strokeWidth={0.4}
          fill="none"
          opacity={0.5}
        />
        <path
          d="M 76 4 Q 66 18 70 34"
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

      <div className="absolute" style={{ top: "44%", left: "1%" }}>
        <RopeKnot />
      </div>
      <div className="absolute" style={{ top: "44%", right: "1%", transform: "scaleX(-1)" }}>
        <RopeKnot />
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
