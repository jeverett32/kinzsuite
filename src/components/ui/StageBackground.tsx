import { PALETTE } from "@/lib/utils";

const GOLD_DEEP = "#B8851F";
const GOLD = "#E6B23A";
const GOLD_LIGHT = "#F5D55E";
const RED_DEEP = "#6B0F14";
const RED = "#A8181F";
const RED_LIGHT = "#D93838";
const WOOD_DARK = "#5B3A1E";
const WOOD = "#8B5A2B";
const WOOD_LIGHT = "#B07E3F";

function RopeTieback({ side }: { side: "left" | "right" }) {
  const flip = side === "right" ? -1 : 1;
  return (
    <svg
      viewBox="0 0 80 120"
      width={64}
      height={96}
      style={{
        position: "absolute",
        top: "26%",
        [side]: "4%",
        transform: `scaleX(${flip})`,
        zIndex: 5,
        filter: `drop-shadow(0 3px 0 ${PALETTE.ink}33)`,
      }}
    >
      <defs>
        <linearGradient id={`rope-${side}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={GOLD_DEEP} />
          <stop offset="50%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD_DEEP} />
        </linearGradient>
      </defs>
      <path
        d="M 8 20 C 20 30, 60 30, 72 20 C 76 40, 56 52, 40 52 C 24 52, 4 40, 8 20 Z"
        fill={`url(#rope-${side})`}
        stroke={PALETTE.ink}
        strokeWidth={2}
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M ${10 + i * 11} 22 Q ${14 + i * 11} 36, ${10 + i * 11} 50`}
          stroke={PALETTE.ink}
          strokeWidth={1}
          fill="none"
          opacity={0.45}
        />
      ))}
      <circle cx={40} cy={56} r={6} fill={GOLD} stroke={PALETTE.ink} strokeWidth={2} />
      <path
        d="M 34 60 L 32 96 M 38 60 L 36 100 M 42 60 L 44 100 M 46 60 L 48 96"
        stroke={GOLD_DEEP}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <path
        d="M 30 96 Q 40 108, 50 96"
        fill={GOLD}
        stroke={PALETTE.ink}
        strokeWidth={2}
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
            ${GOLD} 8px,
            ${GOLD_LIGHT} 18px,
            ${GOLD} 28px,
            ${GOLD_DEEP} 36px)`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: 40,
          background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)`,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 4 }}
      >
        <defs>
          <linearGradient id="red-curtain-left" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={RED_DEEP} />
            <stop offset="20%" stopColor={RED} />
            <stop offset="40%" stopColor={RED_LIGHT} />
            <stop offset="60%" stopColor={RED} />
            <stop offset="80%" stopColor={RED_DEEP} />
            <stop offset="100%" stopColor={RED} />
          </linearGradient>
          <linearGradient id="red-curtain-right" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={RED} />
            <stop offset="20%" stopColor={RED_DEEP} />
            <stop offset="40%" stopColor={RED} />
            <stop offset="60%" stopColor={RED_LIGHT} />
            <stop offset="80%" stopColor={RED} />
            <stop offset="100%" stopColor={RED_DEEP} />
          </linearGradient>
        </defs>
        <path
          d="M 0 0 L 30 0 L 28 8 Q 24 20, 22 32 Q 26 44, 18 56 Q 22 64, 14 72 Q 18 78, 10 82 L 0 78 Z"
          fill="url(#red-curtain-left)"
          stroke={PALETTE.ink}
          strokeWidth={0.4}
        />
        <path
          d="M 100 0 L 70 0 L 72 8 Q 76 20, 78 32 Q 74 44, 82 56 Q 78 64, 86 72 Q 82 78, 90 82 L 100 78 Z"
          fill="url(#red-curtain-right)"
          stroke={PALETTE.ink}
          strokeWidth={0.4}
        />
        <path
          d="M 0 0 L 100 0 L 100 6 Q 80 12, 50 10 Q 20 12, 0 6 Z"
          fill={RED_DEEP}
          stroke={PALETTE.ink}
          strokeWidth={0.4}
        />
        <path
          d="M 0 5 Q 25 11, 50 9 Q 75 11, 100 5"
          stroke={GOLD_LIGHT}
          strokeWidth={0.6}
          fill="none"
        />
      </svg>

      <RopeTieback side="left" />
      <RopeTieback side="right" />

      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: "22%",
          background: `repeating-linear-gradient(180deg,
            ${WOOD} 0px,
            ${WOOD_LIGHT} 22px,
            ${WOOD} 44px,
            ${WOOD_DARK} 46px,
            ${WOOD} 48px)`,
          borderTop: `3px solid ${PALETTE.ink}`,
          boxShadow: `inset 0 12px 18px rgba(0,0,0,0.35)`,
          zIndex: 3,
        }}
      />
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "22%",
          height: 8,
          background: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 100%)`,
          zIndex: 3,
        }}
      />
    </div>
  );
}
