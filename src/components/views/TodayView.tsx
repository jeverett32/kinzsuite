"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Sparkles, Coins, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { PartnerToggle } from "@/components/ui/PartnerToggle";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade } from "@/lib/utils";
import type { DailyTask, DailyLog, Profile } from "@/lib/supabase/types";

type Props = {
  initialTasks: DailyTask[];
  initialLog: DailyLog[];
  initialProfiles: Profile[];
  userId: string;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Count consecutive days ending at today (or yesterday if today not done). */
function computeStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const dates = new Set(logs.map((l) => l.log_date));
  const today = todayIso();
  let cursor = dates.has(today) ? today : shiftDate(today, -1);
  let streak = 0;
  while (dates.has(cursor)) {
    streak++;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

export function TodayView({ initialTasks, initialLog, initialProfiles, userId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);
  const [log, setLog] = useState<DailyLog[]>(initialLog);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [side, setSide] = useState<"me" | "partner">("me");

  // Realtime: daily_tasks, daily_log, profiles
  useEffect(() => {
    const channel = supabase
      .channel("today")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_tasks" },
        (payload) => {
          setTasks((cur) => {
            if (payload.eventType === "INSERT") return [...cur, payload.new as DailyTask];
            if (payload.eventType === "DELETE")
              return cur.filter((t) => t.id !== (payload.old as DailyTask).id);
            return cur.map((t) =>
              t.id === (payload.new as DailyTask).id ? (payload.new as DailyTask) : t,
            );
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_log" },
        (payload) => {
          setLog((cur) => {
            if (payload.eventType === "DELETE") {
              const o = payload.old as DailyLog;
              return cur.filter((l) => !(l.user_id === o.user_id && l.log_date === o.log_date));
            }
            const n = payload.new as DailyLog;
            const idx = cur.findIndex(
              (l) => l.user_id === n.user_id && l.log_date === n.log_date,
            );
            if (idx === -1) return [...cur, n];
            const next = [...cur];
            next[idx] = n;
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          setProfiles((cur) =>
            cur.map((p) =>
              p.id === (payload.new as Profile).id ? (payload.new as Profile) : p,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Clear yesterday's checkmarks client-side (server's nightly cron also
  // does this if enabled).
  useEffect(() => {
    const today = todayIso();
    const stale = tasks.filter((t) => t.completed_at && t.completed_at !== today);
    if (stale.length && stale.some((t) => t.user_id === userId)) {
      void supabase
        .from("daily_tasks")
        .update({ completed_at: null })
        .in(
          "id",
          stale.filter((t) => t.user_id === userId).map((t) => t.id),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = profiles.find((p) => p.id === userId) ?? null;
  const partner = profiles.find((p) => p.id !== userId) ?? null;
  const meName = me?.display_name || "You";
  const partnerName = partner?.display_name || "Partner";

  const viewedUserId = side === "me" ? me?.id : partner?.id;
  const viewedProfile = side === "me" ? me : partner;

  const viewedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.user_id === viewedUserId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks, viewedUserId],
  );

  const today = todayIso();
  const done = viewedTasks.filter((t) => t.completed_at === today);
  const pointsToday = done.reduce((s, t) => s + t.points, 0);
  const possibleToday = viewedTasks.reduce((s, t) => s + t.points, 0);
  const streak = useMemo(
    () => computeStreak(log.filter((l) => l.user_id === viewedUserId)),
    [log, viewedUserId],
  );
  const totalPoints = viewedProfile?.total_points ?? 0;

  const isMine = side === "me";
  const headerLabel = format(new Date(), "EEEE · MMM d");

  async function toggle(task: DailyTask) {
    if (task.user_id !== userId) return; // can't toggle partner's tasks
    // Optimistic flip on the visible state
    const wasDone = task.completed_at === today;
    setTasks((cur) =>
      cur.map((t) =>
        t.id === task.id ? { ...t, completed_at: wasDone ? null : today } : t,
      ),
    );
    const { error } = await supabase.rpc("toggle_daily_task", { task_id: task.id });
    if (error) {
      // Revert on error
      setTasks((cur) =>
        cur.map((t) =>
          t.id === task.id ? { ...t, completed_at: wasDone ? today : null } : t,
        ),
      );
    }
  }

  return (
    <div className="pb-6">
      <div className="flex items-end justify-between gap-2.5 px-4 pb-3 pt-1">
        <div className="min-w-0 flex-1">
          <div
            className="font-hand text-[22px] leading-none text-white"
            style={{ textShadow: `0 2px 0 ${PALETTE.ink}` }}
          >
            {headerLabel}
          </div>
          <div
            className="font-display mt-1 text-[28px] leading-none"
            style={{ color: PALETTE.ink, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}
          >
            DAILY QUESTS
          </div>
        </div>
      </div>

      <div className="px-4 pb-3.5">
        <PartnerToggle
          value={side}
          onChange={setSide}
          meName={meName}
          partnerName={partnerName}
          noun="tasks"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-4 pb-3.5">
        <Stat label="STREAK" value={`${streak}d`} color={PALETTE.sun} Icon={Flame} />
        <Stat
          label="TODAY"
          value={`${pointsToday}/${possibleToday}`}
          color={PALETTE.blush}
          Icon={Sparkles}
        />
        <Stat
          label="TOTAL"
          value={totalPoints.toLocaleString()}
          color={PALETTE.grass}
          Icon={Coins}
        />
      </div>

      <div className="px-4 pb-3.5">
        <div
          className="kz-sticker rounded-3xl p-3.5"
          style={{ ["--ink" as never]: PALETTE.ink }}
        >
          <div className="mb-3 flex items-center justify-between gap-2.5">
            <div
              className="font-display text-base"
              style={{ color: PALETTE.ink, letterSpacing: 0.4 }}
            >
              QUESTS
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <div
                style={{
                  width: 80,
                  height: 12,
                  borderRadius: 99,
                  overflow: "hidden",
                  background: "#fff",
                  border: `2px solid ${PALETTE.ink}`,
                }}
              >
                <div
                  style={{
                    width: `${possibleToday === 0 ? 0 : Math.round((pointsToday / possibleToday) * 100)}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${PALETTE.grass}, ${PALETTE.sky})`,
                    transition: "width .3s",
                  }}
                />
              </div>
              <span className="font-display text-sm" style={{ color: PALETTE.ink }}>
                {possibleToday === 0
                  ? "0%"
                  : `${Math.round((pointsToday / possibleToday) * 100)}%`}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            {viewedTasks.length === 0 && (
              <div
                className="font-hand py-6 text-center text-base"
                style={{ color: PALETTE.ink, opacity: 0.55 }}
              >
                no tasks yet
              </div>
            )}
            {viewedTasks.map((t, i) => {
              const isDone = t.completed_at === today;
              const interactive = isMine;
              return (
                <button
                  key={t.id}
                  onClick={interactive ? () => toggle(t) : undefined}
                  disabled={!interactive}
                  className="flex items-center gap-2.5 py-2.5 text-left"
                  style={{
                    borderTop: i ? `2px dashed ${PALETTE.ink}20` : "none",
                    cursor: interactive ? "pointer" : "default",
                    background: "transparent",
                    opacity: interactive || isDone ? 1 : 0.85,
                  }}
                >
                  <div
                    className="grid place-items-center transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: isDone
                        ? `linear-gradient(180deg, ${PALETTE.grass}, ${shade(PALETTE.grass, -15)})`
                        : "#fff",
                      border: `2.5px solid ${PALETTE.ink}`,
                      boxShadow: isDone
                        ? `0 3px 0 ${PALETTE.ink}`
                        : `0 2px 0 ${PALETTE.ink}`,
                    }}
                  >
                    {isDone && <Check size={16} color="#fff" strokeWidth={3.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: PALETTE.ink,
                        textDecoration: isDone ? "line-through" : "none",
                        opacity: isDone ? 0.55 : 1,
                      }}
                    >
                      {t.task_name}
                    </div>
                  </div>
                  <span
                    className="font-display min-w-9 text-right text-sm"
                    style={{ color: PALETTE.ink, opacity: 0.75 }}
                  >
                    +{t.points}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!isMine && (
        <div className="px-4">
          <div
            className="font-hand text-center text-base"
            style={{ color: PALETTE.ink, opacity: 0.55 }}
          >
            you can&apos;t check off {partnerName}&apos;s tasks — only they can
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  Icon,
}: {
  label: string;
  value: string;
  color: string;
  Icon: LucideIcon;
}) {
  return (
    <div
      className="kz-sticker flex flex-col items-center gap-0.5 rounded-[18px] px-2 py-2.5"
      style={{ ["--ink" as never]: PALETTE.ink }}
    >
      <div
        className="grid place-items-center"
        style={{
          width: 30,
          height: 30,
          borderRadius: 99,
          background: `linear-gradient(180deg, ${color}, ${shade(color, -15)})`,
          border: `2px solid ${PALETTE.ink}`,
          color: "#fff",
        }}
      >
        <Icon size={15} strokeWidth={2.4} />
      </div>
      <div
        className="font-display mt-1 text-[18px] leading-none"
        style={{ color: PALETTE.ink }}
      >
        {value}
      </div>
      <div
        className="text-[9px] font-bold tracking-wider"
        style={{ color: PALETTE.ink, opacity: 0.6 }}
      >
        {label}
      </div>
    </div>
  );
}
