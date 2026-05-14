"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { createClient } from "@/lib/supabase/client";
import type { AccentColor, DailyTask, WheelQuest } from "@/lib/supabase/types";
import { PALETTE } from "@/lib/utils";

const ACCENTS: AccentColor[] = ["sky", "blush", "sun", "grass", "purple"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  userId: string;
  initialTasks: DailyTask[];
  initialQuests: WheelQuest[];
};

export function AdministrationView({ userId, initialTasks, initialQuests }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const today = todayIso();

  const [tasks, setTasks] = useState<DailyTask[]>(() =>
    initialTasks
      .filter((t) => t.user_id === userId)
      .sort((a, b) => a.sort_order - b.sort_order),
  );
  const [quests, setQuests] = useState<WheelQuest[]>(() =>
    [...initialQuests].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setTasks(
      initialTasks
        .filter((t) => t.user_id === userId)
        .sort((a, b) => a.sort_order - b.sort_order),
    );
  }, [initialTasks, userId]);

  useEffect(() => {
    setQuests([...initialQuests].sort((a, b) => a.sort_order - b.sort_order));
  }, [initialQuests]);

  function setError(e: unknown) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    setErr(msg);
    window.setTimeout(() => setErr(null), 5000);
  }

  async function saveTask(t: DailyTask) {
    setErr(null);
    const lockedPoints = t.completed_at === today;
    const { error } = await supabase
      .from("daily_tasks")
      .update({
        task_name: t.task_name,
        sort_order: t.sort_order,
        ...(lockedPoints ? {} : { points: t.points }),
      })
      .eq("id", t.id)
      .eq("user_id", userId);
    if (error) setError(error);
  }

  async function deleteTask(t: DailyTask) {
    if (t.completed_at === today) {
      setErr("Uncheck this task for today before deleting it.");
      return;
    }
    setErr(null);
    const { error } = await supabase.from("daily_tasks").delete().eq("id", t.id).eq("user_id", userId);
    if (error) {
      setError(error);
      return;
    }
    setTasks((cur) => cur.filter((x) => x.id !== t.id));
  }

  async function addTask() {
    setErr(null);
    const maxSort = tasks.reduce((m, t) => Math.max(m, t.sort_order), -1);
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: userId,
        task_name: "New task",
        points: 1,
        sort_order: maxSort + 1,
      })
      .select("*")
      .single();
    if (error) {
      setError(error);
      return;
    }
    if (data) setTasks((cur) => [...cur, data].sort((a, b) => a.sort_order - b.sort_order));
  }

  function patchTask(id: string, patch: Partial<DailyTask>) {
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function saveQuest(q: WheelQuest) {
    setErr(null);
    const { error } = await supabase
      .from("wheel_quests")
      .update({
        tag: q.tag,
        title: q.title,
        detail: q.detail,
        accent: q.accent,
        sort_order: q.sort_order,
      })
      .eq("id", q.id);
    if (error) setError(error);
  }

  async function deleteQuest(q: WheelQuest) {
    if (quests.length <= 1) {
      setErr("Keep at least one wheel quest.");
      return;
    }
    setErr(null);
    const { error } = await supabase.from("wheel_quests").delete().eq("id", q.id);
    if (error) {
      setError(error);
      return;
    }
    setQuests((cur) => cur.filter((x) => x.id !== q.id));
  }

  async function addQuest() {
    setErr(null);
    const maxSort = quests.reduce((m, q) => Math.max(m, q.sort_order), -1);
    const { data, error } = await supabase
      .from("wheel_quests")
      .insert({
        tag: "New",
        title: "New date quest",
        detail: "Describe what to do together.",
        accent: "blush",
        sort_order: maxSort + 1,
      })
      .select("*")
      .single();
    if (error) {
      setError(error);
      return;
    }
    if (data) setQuests((cur) => [...cur, data].sort((a, b) => a.sort_order - b.sort_order));
  }

  function patchQuest(id: string, patch: Partial<WheelQuest>) {
    setQuests((cur) => cur.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  return (
    <div className="px-4 pb-28 pt-2">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/"
          className="font-display inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
          style={{
            background: "#fff",
            border: `2px solid ${PALETTE.ink}`,
            boxShadow: `0 2px 0 ${PALETTE.ink}`,
            color: PALETTE.ink,
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
          Back
        </Link>
      </div>

      <div
        className="font-display text-[26px] leading-none"
        style={{ color: PALETTE.ink, textShadow: "0 2px 0 rgba(255,255,255,0.45)" }}
      >
        ADMINISTRATION
      </div>
      <p className="font-hand mt-1 text-base text-white" style={{ textShadow: `0 2px 0 ${PALETTE.ink}` }}>
        Your daily tasks (your list only) · Wheel quests shared by both of you
      </p>

      {err && (
        <div className="mt-3 rounded-2xl border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {err}
        </div>
      )}

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg" style={{ color: PALETTE.ink }}>
            Daily tasks
          </h2>
          <ChunkyButton type="button" color="grass" size="sm" icon={<Plus size={14} />} onClick={() => void addTask()}>
            Add
          </ChunkyButton>
        </div>
        <div
          className="kz-sticker space-y-3 rounded-3xl p-3.5"
          style={{ ["--ink" as never]: PALETTE.ink }}
        >
          {tasks.length === 0 && (
            <p className="font-hand text-center text-sm" style={{ color: PALETTE.ink, opacity: 0.6 }}>
              No tasks yet — tap Add.
            </p>
          )}
          {tasks.map((t) => {
            const locked = t.completed_at === today;
            return (
              <div
                key={t.id}
                className="rounded-2xl border-2 bg-white/90 p-3"
                style={{ borderColor: PALETTE.ink }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <label className="min-w-0 flex-1">
                    <span className="font-display text-[10px] tracking-wider opacity-60">NAME</span>
                    <input
                      value={t.task_name}
                      onChange={(e) => patchTask(t.id, { task_name: e.target.value })}
                      className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                      style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                    />
                  </label>
                  <label className="w-24 shrink-0">
                    <span className="font-display text-[10px] tracking-wider opacity-60">POINTS</span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      disabled={locked}
                      value={t.points}
                      onChange={(e) =>
                        patchTask(t.id, { points: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })
                      }
                      className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none disabled:opacity-45"
                      style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                    />
                  </label>
                  <label className="w-20 shrink-0">
                    <span className="font-display text-[10px] tracking-wider opacity-60">ORDER</span>
                    <input
                      type="number"
                      value={t.sort_order}
                      onChange={(e) =>
                        patchTask(t.id, { sort_order: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                      style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                    />
                  </label>
                </div>
                {locked && (
                  <p className="mt-1.5 font-hand text-xs" style={{ color: PALETTE.ink, opacity: 0.65 }}>
                    Done today — points are locked until you uncheck it on Today.
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <ChunkyButton type="button" color="blush" size="sm" onClick={() => void saveTask(t)}>
                    Save
                  </ChunkyButton>
                  <ChunkyButton
                    type="button"
                    color="white"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => void deleteTask(t)}
                  >
                    Delete
                  </ChunkyButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg" style={{ color: PALETTE.ink }}>
            Wheel quests (Date tab)
          </h2>
          <ChunkyButton type="button" color="sky" size="sm" icon={<Plus size={14} />} onClick={() => void addQuest()}>
            Add
          </ChunkyButton>
        </div>
        <div
          className="kz-sticker space-y-3 rounded-3xl p-3.5"
          style={{ ["--ink" as never]: PALETTE.ink }}
        >
          {quests.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border-2 bg-white/90 p-3"
              style={{ borderColor: PALETTE.ink }}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <label>
                  <span className="font-display text-[10px] tracking-wider opacity-60">TAG</span>
                  <input
                    value={q.tag}
                    onChange={(e) => patchQuest(q.id, { tag: e.target.value })}
                    className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                    style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                  />
                </label>
                <label>
                  <span className="font-display text-[10px] tracking-wider opacity-60">ACCENT</span>
                  <select
                    value={q.accent}
                    onChange={(e) => patchQuest(q.id, { accent: e.target.value as AccentColor })}
                    className="mt-0.5 w-full rounded-xl border-2 bg-white px-2 py-1.5 font-body text-sm outline-none"
                    style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                  >
                    {ACCENTS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="font-display text-[10px] tracking-wider opacity-60">TITLE</span>
                  <input
                    value={q.title}
                    onChange={(e) => patchQuest(q.id, { title: e.target.value })}
                    className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                    style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="font-display text-[10px] tracking-wider opacity-60">DETAIL</span>
                  <textarea
                    value={q.detail}
                    onChange={(e) => patchQuest(q.id, { detail: e.target.value })}
                    rows={2}
                    className="mt-0.5 w-full resize-none rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                    style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                  />
                </label>
                <label>
                  <span className="font-display text-[10px] tracking-wider opacity-60">ORDER</span>
                  <input
                    type="number"
                    value={q.sort_order}
                    onChange={(e) =>
                      patchQuest(q.id, { sort_order: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="mt-0.5 w-full rounded-xl border-2 bg-white px-2.5 py-1.5 font-body text-sm outline-none"
                    style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                  />
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <ChunkyButton type="button" color="blush" size="sm" onClick={() => void saveQuest(q)}>
                  Save
                </ChunkyButton>
                <ChunkyButton
                  type="button"
                  color="white"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => void deleteQuest(q)}
                >
                  Delete
                </ChunkyButton>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
