"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { createClient } from "@/lib/supabase/client";
import { STATIC_QUESTS_FALLBACK, type Quest } from "@/lib/quests";
import { PALETTE } from "@/lib/utils";
import type { WheelQuest } from "@/lib/supabase/types";

const SLICE_COLORS = [
  "#E94B7B", "#E2553A", "#F0A93A", "#F2D24B",
  "#7DBE43", "#3FB4A1", "#3F8EE0", "#8E6BD9",
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function toQuestList(rows: WheelQuest[]): Quest[] {
  if (rows.length > 0) {
    return [...rows]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((r) => ({
        id: r.id,
        tag: r.tag,
        title: r.title,
        detail: r.detail,
        accent: r.accent,
      }));
  }
  return STATIC_QUESTS_FALLBACK.map((q, i) => ({ ...q, id: `fallback-${i}` }));
}

function Wheel({
  quests,
  onLand,
}: {
  quests: Quest[];
  onLand: (i: number) => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const N = quests.length;
  const slice = N > 0 ? 360 / N : 0;
  const SIZE = 280;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rOuter = SIZE / 2 - 4;
  const rRim = rOuter - 10;
  const rHub = 38;

  function spin() {
    if (spinning || N < 1) return;
    const target = Math.floor(Math.random() * N);
    const turns = 5 + Math.floor(Math.random() * 3);
    const targetCenter = target * slice + slice / 2;
    const currentMod = ((rotation % 360) + 360) % 360;
    const desired = (360 - targetCenter) % 360;
    const delta = ((desired - currentMod) + 360) % 360 + 360 * turns;
    setSpinning(true);
    setRotation((r) => r + delta);
    window.setTimeout(() => {
      setSpinning(false);
      onLand(target);
    }, 4300);
  }

  if (N < 1) {
    return (
      <div
        className="kz-sticker mx-auto max-w-sm rounded-3xl p-6 text-center"
        style={{ ["--ink" as never]: PALETTE.ink }}
      >
        <p className="font-hand text-base" style={{ color: PALETTE.ink, opacity: 0.75 }}>
          No wheel quests yet. Add some in Administration.
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto" style={{ width: SIZE + 60, height: SIZE + 80 }}>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 0,
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderTop: `28px solid ${PALETTE.ink}`,
          zIndex: 6,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: 4,
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "22px solid #E33C3C",
          zIndex: 7,
        }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          marginLeft: -SIZE / 2,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
          transition: spinning
            ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.32, 1.18)"
            : "none",
          filter: `drop-shadow(0 6px 0 ${PALETTE.ink}) drop-shadow(0 12px 12px rgba(0,0,0,0.25))`,
        }}
      >
        <circle cx={cx} cy={cy} r={rOuter} fill="#fff" stroke={PALETTE.ink} strokeWidth={3} />
        {[...Array(N * 3)].map((_, i) => {
          const a = (i / (N * 3)) * 360;
          const p = polar(cx, cy, rOuter - 5, a);
          return <circle key={i} cx={p.x} cy={p.y} r={2} fill={PALETTE.ink} opacity={0.55} />;
        })}
        {quests.map((q, i) => {
          const start = i * slice;
          const end = (i + 1) * slice;
          const p1 = polar(cx, cy, rRim, start);
          const p2 = polar(cx, cy, rRim, end);
          const large = slice > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${rRim} ${rRim} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
          const mid = start + slice / 2;
          const labelPos = polar(cx, cy, rRim - 26, mid);
          return (
            <g key={q.id ?? i}>
              <path
                d={path}
                fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                stroke={PALETTE.ink}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}
                fill="#fff"
                fontFamily="var(--font-lilita), sans-serif"
                fontSize="13"
                letterSpacing="0.5"
                textAnchor="middle"
                dominantBaseline="central"
                stroke={PALETTE.ink}
                strokeWidth="0.6"
                paintOrder="stroke"
              >
                {q.tag.toUpperCase()}
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={rHub} fill={PALETTE.sun} stroke={PALETTE.ink} strokeWidth={3} />
        <text
          x={cx}
          y={cy}
          fill={PALETTE.ink}
          fontFamily="var(--font-lilita), sans-serif"
          fontSize="22"
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing="1"
        >
          DATE
        </text>
      </svg>

      <button
        onClick={spin}
        disabled={spinning}
        aria-label="Spin the wheel"
        className="font-display absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 0,
          width: 100,
          height: 100,
          borderRadius: 999,
          background: `radial-gradient(circle at 32% 28%, #ff9595 0%, #E33C3C 50%, #8a1419 100%)`,
          border: `3px solid ${PALETTE.ink}`,
          boxShadow: `0 8px 0 ${PALETTE.ink}, inset 0 -12px 0 -3px rgba(0,0,0,0.32), inset 0 10px 0 -3px rgba(255,255,255,0.45)`,
          color: "#fff",
          fontSize: 24,
          letterSpacing: 2,
          textShadow: "0 2px 0 rgba(0,0,0,0.5)",
          cursor: spinning ? "wait" : "pointer",
        }}
      >
        SPIN
      </button>
    </div>
  );
}

type Props = {
  initialWheelQuests: WheelQuest[];
};

export function DateView({ initialWheelQuests }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [quests, setQuests] = useState<Quest[]>(() => toQuestList(initialWheelQuests));

  useEffect(() => {
    setQuests(toQuestList(initialWheelQuests));
  }, [initialWheelQuests]);

  useEffect(() => {
    async function reload() {
      const { data } = await supabase.from("wheel_quests").select("*").order("sort_order");
      setQuests(toQuestList(data ?? []));
    }

    const channel = supabase
      .channel("wheel_quests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wheel_quests" },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const [questIdx, setQuestIdx] = useState(0);

  useEffect(() => {
    setQuestIdx((i) => Math.min(i, Math.max(0, quests.length - 1)));
  }, [quests.length]);

  const current = quests[questIdx] ?? quests[0];

  if (!current) {
    return (
      <div className="px-4 pb-6 pt-1">
        <p className="text-center font-hand text-base text-white" style={{ textShadow: `0 2px 0 ${PALETTE.ink}` }}>
          No quests to show.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-1">
      <div className="mb-3 text-center">
        <div
          className="font-hand text-[26px] text-white"
          style={{ textShadow: `0 2px 0 ${PALETTE.ink}` }}
        >
          Tonight, the wheel says…
        </div>
        <div
          className="font-display mt-0.5 text-[28px] leading-none"
          style={{ color: PALETTE.ink, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}
        >
          DATE WHEEL
        </div>
      </div>

      <div className="relative pb-3.5 pt-1.5">
        <Wheel quests={quests} onLand={setQuestIdx} />
      </div>

      <div
        className="kz-sticker mt-2 rounded-[22px] p-4"
        style={{ ["--ink" as never]: PALETTE.ink }}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <div
            className="font-hand text-lg"
            style={{ color: PALETTE[current.accent] }}
          >
            Your quest
          </div>
          <Chip tone={current.accent}>★ {current.tag}</Chip>
        </div>
        <div className="font-display text-[22px] leading-tight" style={{ color: PALETTE.ink }}>
          {current.title}
        </div>
        <div
          className="mt-1.5 text-[13px] font-medium leading-snug"
          style={{ color: PALETTE.ink, opacity: 0.7 }}
        >
          {current.detail}
        </div>
        <div className="mt-3.5">
          <ChunkyButton color="grass" full icon={<Check size={16} strokeWidth={2.4} />}>
            ACCEPT QUEST
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}
