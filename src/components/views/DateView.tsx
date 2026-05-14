"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { StageBackground } from "@/components/ui/StageBackground";
import { createClient } from "@/lib/supabase/client";
import { STATIC_QUESTS_FALLBACK, type Quest } from "@/lib/quests";
import { PALETTE } from "@/lib/utils";
import type { WheelQuest } from "@/lib/supabase/types";

const STAGE_BLUE_LIGHT = "#A8E2F5";
const STAGE_BLUE = "#7CCBE6";
const STAGE_BLUE_DEEP = "#4FA8C8";
const HUB_RED = "#E33C3C";
const HUB_RED_DARK = "#8E1414";

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
  alignSliceIndex,
}: {
  quests: Quest[];
  onLand: (i: number) => void;
  alignSliceIndex: number | null;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const N = quests.length;
  const slice = N > 0 ? 360 / N : 0;
  const SIZE = 220;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const rOuter = SIZE / 2 - 4;
  const rRim = rOuter - 8;
  const rHub = 50;

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

  const lastAlignedSlice = useRef<number | null>(null);

  useEffect(() => {
    if (N < 1 || slice <= 0) return;
    if (alignSliceIndex == null) {
      lastAlignedSlice.current = null;
      return;
    }
    if (alignSliceIndex < 0 || alignSliceIndex >= N) return;
    if (lastAlignedSlice.current === alignSliceIndex) return;
    lastAlignedSlice.current = alignSliceIndex;
    const targetCenter = alignSliceIndex * slice + slice / 2;
    const desired = (360 - targetCenter) % 360;
    setRotation(desired);
  }, [alignSliceIndex, N, slice]);

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

  const WHEEL_TOP = 18;
  const PLAT_W = SIZE + 60;
  const PLAT_H = 46;
  const PLAT_INSET = 34;
  const PLAT_TOP_DEPTH = 14;
  const PLAT_TOP_Y = WHEEL_TOP + SIZE - 12;
  const SPIN_SIZE = 54;
  const OUTER_W = PLAT_W + 20;
  const OUTER_H = PLAT_TOP_Y + PLAT_H + 6;

  return (
    <div className="relative mx-auto" style={{ width: OUTER_W, height: OUTER_H }}>
      <svg
        width={PLAT_W}
        height={PLAT_H}
        viewBox={`0 0 ${PLAT_W} ${PLAT_H}`}
        style={{
          position: "absolute",
          top: PLAT_TOP_Y,
          left: "50%",
          marginLeft: -PLAT_W / 2,
          zIndex: 1,
          filter: `drop-shadow(0 5px 0 rgba(0,0,0,0.25))`,
        }}
      >
        <path
          d={`M 0 ${PLAT_TOP_DEPTH} L ${PLAT_W} ${PLAT_TOP_DEPTH} L ${PLAT_W} ${PLAT_H - 4} L 0 ${PLAT_H - 4} Z`}
          fill={STAGE_BLUE}
          stroke={PALETTE.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d={`M ${PLAT_INSET} 0 L ${PLAT_W - PLAT_INSET} 0 L ${PLAT_W} ${PLAT_TOP_DEPTH} L 0 ${PLAT_TOP_DEPTH} Z`}
          fill={STAGE_BLUE_LIGHT}
          stroke={PALETTE.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>

      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: WHEEL_TOP - 18,
          width: 18,
          height: 28,
          background: STAGE_BLUE_LIGHT,
          border: `3px solid ${PALETTE.ink}`,
          borderRadius: 4,
          zIndex: 2,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: WHEEL_TOP - 4,
          width: 0,
          height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: `22px solid ${PALETTE.ink}`,
          zIndex: 6,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: WHEEL_TOP - 1,
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: `16px solid ${HUB_RED}`,
          zIndex: 7,
        }}
      />

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{
          position: "absolute",
          top: WHEEL_TOP,
          left: "50%",
          marginLeft: -SIZE / 2,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "50% 50%",
          transition: spinning
            ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.32, 1.18)"
            : "none",
          filter: `drop-shadow(0 6px 0 ${PALETTE.ink}) drop-shadow(0 12px 12px rgba(0,0,0,0.25))`,
          zIndex: 3,
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
          fill={HUB_RED}
          fontFamily="var(--font-lilita), sans-serif"
          fontSize="34"
          textAnchor="middle"
          dominantBaseline="central"
          letterSpacing="1"
          stroke={HUB_RED_DARK}
          strokeWidth="1.4"
          paintOrder="stroke"
        >
          WOW!
        </text>
      </svg>

      <button
        onClick={spin}
        disabled={spinning}
        aria-label="Spin the wheel"
        className="font-display absolute left-1/2 -translate-x-1/2"
        style={{
          top: PLAT_TOP_Y + PLAT_TOP_DEPTH - SPIN_SIZE + 4,
          width: SPIN_SIZE,
          height: SPIN_SIZE,
          borderRadius: 999,
          background: `radial-gradient(circle at 32% 28%, #ff9595 0%, ${HUB_RED} 50%, ${HUB_RED_DARK} 100%)`,
          border: `3px solid ${PALETTE.ink}`,
          boxShadow: `0 5px 0 ${PALETTE.ink}, inset 0 -7px 0 -3px rgba(0,0,0,0.32), inset 0 6px 0 -3px rgba(255,255,255,0.45)`,
          color: "#fff",
          fontSize: 14,
          letterSpacing: 1.5,
          textShadow: "0 2px 0 rgba(0,0,0,0.5)",
          cursor: spinning ? "wait" : "pointer",
          zIndex: 5,
        }}
      >
        SPIN
      </button>
    </div>
  );
}

type Props = {
  initialWheelQuests: WheelQuest[];
  initialAcceptedQuestId: string | null;
};

export function DateView({ initialWheelQuests, initialAcceptedQuestId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [quests, setQuests] = useState<Quest[]>(() => toQuestList(initialWheelQuests));
  const questsRef = useRef(quests);
  useEffect(() => {
    questsRef.current = quests;
  }, [quests]);

  const [acceptedQuestId, setAcceptedQuestId] = useState<string | null>(initialAcceptedQuestId);

  useEffect(() => {
    setAcceptedQuestId(initialAcceptedQuestId);
  }, [initialAcceptedQuestId]);

  useEffect(() => {
    setQuests(toQuestList(initialWheelQuests));
  }, [initialWheelQuests]);

  const [questIdx, setQuestIdx] = useState(0);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("date_wheel_pick").select("accepted_quest_id").eq("id", 1).maybeSingle();
      if (data && "accepted_quest_id" in data) {
        setAcceptedQuestId(data.accepted_quest_id ?? null);
      }
    })();
  }, [supabase]);

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

  useEffect(() => {
    const channel = supabase
      .channel("date_wheel_pick")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "date_wheel_pick", filter: "id=eq.1" },
        (payload) => {
          const row = payload.new as { accepted_quest_id?: string | null } | undefined;
          if (row && "accepted_quest_id" in row) {
            const next = row.accepted_quest_id ?? null;
            setAcceptedQuestId(next);
            if (next) {
              const i = questsRef.current.findIndex((q) => q.id === next);
              if (i >= 0) setQuestIdx(i);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    setQuestIdx((i) => Math.min(i, Math.max(0, quests.length - 1)));
  }, [quests.length]);

  useEffect(() => {
    if (!acceptedQuestId) return;
    const i = questsRef.current.findIndex((q) => q.id === acceptedQuestId);
    if (i >= 0) setQuestIdx(i);
  }, [acceptedQuestId]);

  const [accepting, setAccepting] = useState(false);
  const [acceptErr, setAcceptErr] = useState<string | null>(null);

  const alignSliceIndex = useMemo(() => {
    if (!acceptedQuestId) return null;
    const i = quests.findIndex((q) => q.id === acceptedQuestId);
    return i >= 0 ? i : null;
  }, [acceptedQuestId, quests]);

  const displayQuest = useMemo(() => {
    if (acceptedQuestId) {
      const q = quests.find((x) => x.id === acceptedQuestId);
      if (q) return q;
    }
    return quests[questIdx] ?? quests[0];
  }, [acceptedQuestId, quests, questIdx]);

  const pendingQuest = quests[questIdx] ?? quests[0];
  const canPersist =
    Boolean(pendingQuest?.id) && pendingQuest.id !== undefined && !pendingQuest.id.startsWith("fallback-");

  async function acceptQuest() {
    if (!canPersist || !pendingQuest.id) return;
    setAccepting(true);
    setAcceptErr(null);
    const { error } = await supabase
      .from("date_wheel_pick")
      .update({
        accepted_quest_id: pendingQuest.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setAccepting(false);
    if (error) {
      setAcceptErr(error.message);
      return;
    }
    setAcceptedQuestId(pendingQuest.id);
  }

  const current = displayQuest;

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
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: "5 / 4", border: `3px solid ${PALETTE.ink}` }}
      >
        <StageBackground />
        <div className="absolute inset-x-0 flex justify-center" style={{ bottom: -18 }}>
          <Wheel quests={quests} onLand={setQuestIdx} alignSliceIndex={alignSliceIndex} />
        </div>
      </div>

      <div
        className="kz-sticker relative mt-3 rounded-[22px] p-4"
        style={{ ["--ink" as never]: PALETTE.ink }}
      >
        <div className="mb-1.5 flex items-center justify-between">
          <div
            className="font-hand text-lg"
            style={{ color: PALETTE[current.accent] }}
          >
            {acceptedQuestId ? "Tonight's quest" : "Your quest"}
          </div>
          <Chip tone={current.accent}>★ {current.tag}</Chip>
        </div>
        {acceptedQuestId && (
          <p className="mb-1.5 font-hand text-xs leading-snug" style={{ color: PALETTE.ink, opacity: 0.65 }}>
            Locked in for both of you — updates live when someone accepts a new slice.
          </p>
        )}
        <div className="font-display text-[22px] leading-tight" style={{ color: PALETTE.ink }}>
          {current.title}
        </div>
        <div
          className="mt-1.5 text-[13px] font-medium leading-snug"
          style={{ color: PALETTE.ink, opacity: 0.7 }}
        >
          {current.detail}
        </div>
        {acceptedQuestId && pendingQuest?.id && pendingQuest.id !== acceptedQuestId && (
          <p className="mt-2 font-hand text-xs leading-snug" style={{ color: PALETTE.ink, opacity: 0.72 }}>
            The wheel is on a different slice — tap below to make that one tonight&apos;s quest for both of you.
          </p>
        )}
        {!canPersist && (
          <p className="mt-2 font-hand text-xs text-red-600">
            Wheel data isn&apos;t loaded from the database yet — accept is unavailable until migrations run.
          </p>
        )}
        {acceptErr && <p className="mt-2 font-hand text-xs text-red-600">{acceptErr}</p>}
        <div className="mt-3.5">
          <ChunkyButton
            color="grass"
            full
            icon={<Check size={16} strokeWidth={2.4} />}
            disabled={accepting || !canPersist}
            onClick={() => void acceptQuest()}
          >
            {accepting
              ? "Saving…"
              : acceptedQuestId && pendingQuest?.id !== acceptedQuestId
                ? "UPDATE QUEST FOR BOTH"
                : "ACCEPT QUEST"}
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
}
