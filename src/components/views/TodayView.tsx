"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Flame, Heart, PawPrint } from "lucide-react";
import { format } from "date-fns";
import { Chip } from "@/components/ui/Chip";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade, type PaletteColor } from "@/lib/utils";
import type { DailyTask, Profile } from "@/lib/supabase/types";

type Props = {
  initialTasks: DailyTask[];
  userId: string;
  profiles: Profile[];
};

export function TodayView({ initialTasks, userId, profiles }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<DailyTask[]>(initialTasks);

  // Subscribe to realtime updates on daily_tasks so both partners see toggles.
  useEffect(() => {
    const channel = supabase
      .channel("daily-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_tasks" },
        (payload) => {
          setTasks((current) => {
            if (payload.eventType === "INSERT") {
              return [...current, payload.new as DailyTask].sort(
                (a, b) => a.sort_order - b.sort_order,
              );
            }
            if (payload.eventType === "DELETE") {
              return current.filter((t) => t.id !== (payload.old as DailyTask).id);
            }
            return current.map((t) =>
              t.id === (payload.new as DailyTask).id ? (payload.new as DailyTask) : t,
            );
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Reset stale completions client-side too (in case the cron hasn't run yet).
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stale = tasks.filter((t) => t.completed_at && t.completed_at !== today);
    if (stale.length) {
      void supabase
        .from("daily_tasks")
        .update({ completed_by: null, completed_at: null })
        .in(
          "id",
          stale.map((t) => t.id),
        );
    }
  }, [tasks, supabase]);

  const today = format(new Date(), "EEEE · MMM d");
  const todayIso = new Date().toISOString().slice(0, 10);
  const isDone = (t: DailyTask) => t.completed_at === todayIso;
  const completed = tasks.filter(isDone).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  async function toggle(task: DailyTask) {
    const done = isDone(task);
    // Optimistic update.
    setTasks((cur) =>
      cur.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed_by: done ? null : userId,
              completed_at: done ? null : todayIso,
            }
          : t,
      ),
    );
    await supabase
      .from("daily_tasks")
      .update({
        completed_by: done ? null : userId,
        completed_at: done ? null : todayIso,
      })
      .eq("id", task.id);
  }

  return (
    <div className="pb-6">
      <div className="flex items-end justify-between gap-2.5 px-4 pb-3 pt-1">
        <div className="min-w-0 flex-1">
          <div
            className="font-hand text-[22px] leading-none text-white"
            style={{ textShadow: `0 2px 0 ${PALETTE.ink}` }}
          >
            {today}
          </div>
          <div
            className="font-display mt-1 text-[28px] leading-none"
            style={{ color: PALETTE.ink, textShadow: "0 2px 0 rgba(255,255,255,0.5)" }}
          >
            SHARED DAY
          </div>
        </div>
        <Chip tone="grass">
          {completed}/{tasks.length} done
        </Chip>
      </div>

      <div className="grid grid-cols-3 gap-2.5 px-4 pb-3.5">
        {[
          { k: "STREAK", v: "9d", c: PALETTE.sun, Icon: Flame },
          { k: "BOND", v: "+14", c: PALETTE.blush, Icon: Heart },
          { k: "PETS", v: "∞", c: PALETTE.grass, Icon: PawPrint },
        ].map((s, i) => (
          <div
            key={i}
            className="kz-sticker flex flex-col items-center gap-0.5 rounded-[18px] px-2 py-2.5"
            style={{ ["--ink" as any]: PALETTE.ink }}
          >
            <div
              className="grid place-items-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: 99,
                background: `linear-gradient(180deg, ${s.c}, ${shade(s.c, -15)})`,
                border: `2px solid ${PALETTE.ink}`,
                color: "#fff",
              }}
            >
              <s.Icon size={15} strokeWidth={2.4} />
            </div>
            <div
              className="font-display mt-1 text-[18px] leading-none"
              style={{ color: PALETTE.ink }}
            >
              {s.v}
            </div>
            <div
              className="text-[9px] font-bold tracking-wider"
              style={{ color: PALETTE.ink, opacity: 0.6 }}
            >
              {s.k}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-3.5">
        <div
          className="kz-sticker rounded-3xl p-3.5"
          style={{ ["--ink" as any]: PALETTE.ink }}
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
                    width: `${pct}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${PALETTE.grass}, ${PALETTE.sky})`,
                    transition: "width .3s",
                  }}
                />
              </div>
              <span className="font-display text-sm" style={{ color: PALETTE.ink }}>
                {pct}%
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            {tasks.map((t, i) => {
              const done = isDone(t);
              const completer = profiles.find((p) => p.id === t.completed_by);
              const tone: PaletteColor =
                t.assigned_to === "me" ? "sky" : t.assigned_to === "partner" ? "blush" : "grass";
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t)}
                  className="flex cursor-pointer items-center gap-2.5 py-2.5 text-left"
                  style={{
                    borderTop: i ? `2px dashed ${PALETTE.ink}20` : "none",
                  }}
                >
                  <div
                    className="grid place-items-center transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: done
                        ? `linear-gradient(180deg, ${PALETTE.grass}, ${shade(PALETTE.grass, -15)})`
                        : "#fff",
                      border: `2.5px solid ${PALETTE.ink}`,
                      boxShadow: done
                        ? `0 3px 0 ${PALETTE.ink}`
                        : `0 2px 0 ${PALETTE.ink}`,
                    }}
                  >
                    {done && <Check size={16} color="#fff" strokeWidth={3.5} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: PALETTE.ink,
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.5 : 1,
                      }}
                    >
                      {t.task_name}
                    </div>
                    {done && completer && (
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: PALETTE.ink, opacity: 0.6 }}
                      >
                        by {completer.display_name || "someone"}
                      </div>
                    )}
                  </div>
                  <Chip tone={tone}>{t.assigned_to}</Chip>
                  {t.reward && (
                    <span
                      className="font-display min-w-14 text-right text-xs"
                      style={{ color: PALETTE.ink, opacity: 0.7 }}
                    >
                      {t.reward}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
