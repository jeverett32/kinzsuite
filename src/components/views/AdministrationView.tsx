"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Pencil, Plus, Trash2, X } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { createClient } from "@/lib/supabase/client";
import { WHEEL_SLICE_COUNT } from "@/lib/quests";
import type { AccentColor, DailyTask, WheelQuest } from "@/lib/supabase/types";
import { PALETTE, shade } from "@/lib/utils";
import type { Group } from "@/lib/groups";

const ACCENTS: AccentColor[] = ["sky", "blush", "sun", "grass", "purple"];

function todayIso() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function formatErr(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: string }).message === "string") {
    return (e as { message: string }).message;
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

type Props = {
  userId: string;
  initialTasks: DailyTask[];
  initialQuests: WheelQuest[];
  initialGroups: Group[];
  activeGroupId: string | null;
};

type Tab = "tasks" | "quests" | "groups" | "notifications";

export function AdministrationView({ userId, initialTasks, initialQuests, initialGroups, activeGroupId: initialActiveGroupId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const today = todayIso();

  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<DailyTask[]>(() =>
    initialTasks
      .filter((t) => t.user_id === userId)
      .sort((a, b) => a.sort_order - b.sort_order),
  );
  const [quests, setQuests] = useState<WheelQuest[]>(() =>
    [...initialQuests].sort((a, b) => a.sort_order - b.sort_order),
  );
  
  // Group state
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(initialActiveGroupId);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);
  const [groupStatus, setGroupStatus] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pushTestBusy, setPushTestBusy] = useState(false);
  const [pushTestOk, setPushTestOk] = useState<string | null>(null);

  /** Edit sheet: draft copies so list state stays stable until Save. */
  const [taskDraft, setTaskDraft] = useState<DailyTask | null>(null);
  const [questDraft, setQuestDraft] = useState<WheelQuest | null>(null);

  function flashErr(e: unknown) {
    setErr(formatErr(e));
    window.setTimeout(() => setErr(null), 6000);
  }

  const loadGroups = useCallback(async () => {
    const [{ data: memberships }, { data: profile }] = await Promise.all([
      supabase
        .from("group_members")
        .select("group_id, sort_order")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase.from("profiles").select("active_group_id").eq("id", userId).maybeSingle(),
    ]);
    const ids = [...new Set((memberships ?? []).map((row) => row.group_id))];
    const { data: groupRows } = ids.length
      ? await supabase.from("groups").select("*").in("id", ids)
      : { data: [] as Group[] };
    
    // Sort groupRows according to memberships sort_order
    const groupMap = new Map((groupRows ?? []).map(g => [g.id, g]));
    const sortedGroups = ids.map(id => groupMap.get(id)).filter((g): g is Group => !!g);
    
    setGroups(sortedGroups);
    setActiveGroupId(profile?.active_group_id ?? null);
  }, [supabase, userId]);

  async function switchGroup(groupId: string | null) {
    setGroupBusy(true);
    setGroupStatus(null);
    const { error } = await supabase
      .from("profiles")
      .update({ active_group_id: groupId })
      .eq("id", userId);
    setGroupBusy(false);
    if (error) {
      setGroupStatus(error.message);
      return;
    }
    setActiveGroupId(groupId);
    window.location.reload();
  }

  async function createGroup() {
    setGroupBusy(true);
    setGroupStatus(null);
    const { data, error } = await supabase.rpc("create_group", {
      p_name: newGroupName.trim() || "My group",
    });
    setGroupBusy(false);
    if (error) {
      setGroupStatus(error.message);
      return;
    }
    const invite = data?.[0]?.invite_code;
    setGroupStatus(invite ? `Invite code: ${invite}` : "Group created");
    setNewGroupName("");
    await loadGroups();
  }

  async function joinGroup() {
    if (!inviteCode.trim()) return;
    setGroupBusy(true);
    setGroupStatus(null);
    const { error } = await supabase.rpc("join_group_by_code", { p_code: inviteCode.trim() });
    setGroupBusy(false);
    if (error) {
      setGroupStatus(error.message);
      return;
    }
    setInviteCode("");
    await loadGroups();
    window.location.reload();
  }

  async function leaveGroup(groupId: string) {
    setGroupBusy(true);
    setGroupStatus(null);
    const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });
    setGroupBusy(false);
    if (error) {
      setGroupStatus(error.message);
      return;
    }
    await loadGroups();
    window.location.reload();
  }

  async function sendTestPush() {
    setPushTestOk(null);
    setPushTestBusy(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; sent?: number; total?: number };
      if (!res.ok) {
        flashErr(new Error(typeof data.error === "string" ? data.error : "Test notification failed."));
        return;
      }
      const n = typeof data.sent === "number" ? data.sent : 0;
      const t = typeof data.total === "number" ? data.total : n;
      setPushTestOk(`Sent test to ${n} of ${t} saved subscription(s). Check your device for the alert.`);
      window.setTimeout(() => setPushTestOk(null), 8000);
    } finally {
      setPushTestBusy(false);
    }
  }

  async function saveTaskFromDraft(d: DailyTask) {
    setErr(null);
    const lockedPoints = d.completed_at === today;
    const taskUpdate = supabase
      .from("daily_tasks")
      .update({
        task_name: d.task_name,
        sort_order: d.sort_order,
        ...(lockedPoints ? {} : { points: d.points }),
      })
      .eq("id", d.id)
      .eq("user_id", userId);
    const { error } = activeGroupId
      ? await taskUpdate.eq("group_id", activeGroupId)
      : await taskUpdate.is("group_id", null);
    if (error) {
      flashErr(error);
      return;
    }
    setTasks((cur) =>
      cur
        .map((t) => (t.id === d.id ? { ...d } : t))
        .sort((a, b) => a.sort_order - b.sort_order),
    );
    setTaskDraft(null);
  }

  async function deleteTaskRow(t: DailyTask) {
    if (t.completed_at === today) {
      flashErr(new Error("Uncheck this task for today on the Today tab before deleting it."));
      return;
    }
    setErr(null);
    const taskDelete = supabase.from("daily_tasks").delete().eq("id", t.id).eq("user_id", userId);
    const { error } = activeGroupId
      ? await taskDelete.eq("group_id", activeGroupId)
      : await taskDelete.is("group_id", null);
    if (error) {
      flashErr(error);
      return;
    }
    setTasks((cur) => cur.filter((x) => x.id !== t.id));
    setTaskDraft((d) => (d?.id === t.id ? null : d));
  }

  async function addTask() {
    setErr(null);
    setAdding(true);
    const maxSort = tasks.reduce((m, t) => Math.max(m, t.sort_order), -1);
    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: userId,
        group_id: activeGroupId,
        task_name: "New task",
        points: 1,
        sort_order: maxSort + 1,
      })
      .select("*")
      .single();
    setAdding(false);
    if (error) {
      flashErr(error);
      return;
    }
    if (data) {
      setTasks((cur) => [...cur, data].sort((a, b) => a.sort_order - b.sort_order));
      setTaskDraft({ ...data });
    }
  }

  async function saveQuestFromDraft(d: WheelQuest) {
    setErr(null);
    const sort_order = Math.max(0, Math.min(WHEEL_SLICE_COUNT - 1, d.sort_order));
    const questUpdate = supabase
      .from("wheel_quests")
      .update({
        tag: d.tag,
        title: d.title,
        detail: d.detail,
        accent: d.accent,
        sort_order,
      })
      .eq("id", d.id);
    const { error } = activeGroupId
      ? await questUpdate.eq("group_id", activeGroupId)
      : await questUpdate.is("group_id", null);
    if (error) {
      flashErr(error);
      return;
    }
    setQuests((cur) =>
      cur
        .map((q) => (q.id === d.id ? { ...d, sort_order } : q))
        .sort((a, b) => a.sort_order - b.sort_order),
    );
    setQuestDraft(null);
  }

  return (
    <div className="kz-hscroll h-full overflow-y-auto px-4 pb-28 pt-2">
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
        {tab === "tasks"
          ? "Your daily checklist — only you can edit yours."
          : tab === "quests"
          ? `The date wheel always has ${WHEEL_SLICE_COUNT} slices — edit the quests, don’t add or remove them.`
          : tab === "groups"
          ? "Manage your family groups here."
          : "Notification settings and tests."}
      </p>

      {err && (
        <div className="mt-3 rounded-2xl border-2 border-red-500 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {err}
        </div>
      )}

      <div
        className="mt-4 flex flex-wrap rounded-3xl p-1"
        style={{
          background: "rgba(255,255,255,0.35)",
          border: `2.5px solid ${PALETTE.ink}`,
          boxShadow: `0 3px 0 ${PALETTE.ink}`,
        }}
      >
        {(["tasks", "quests", "groups", "notifications"] as const).map((key) => {
          const active = tab === key;
          const labels: Record<Tab, string> = {
            tasks: "Daily tasks",
            quests: "Wheel quests",
            groups: "Groups",
            notifications: "Notifications",
          };
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="font-display relative min-w-[50%] flex-1 rounded-full py-2 text-xs transition-transform sm:min-w-0 sm:text-sm"
              style={{
                background: active ? `#fff` : "transparent",
                color: PALETTE.ink,
                boxShadow: active ? `0 2px 0 ${PALETTE.ink}` : "none",
                transform: active ? "translateY(-1px)" : "none",
                letterSpacing: 0.4,
              }}
            >
              {labels[key]}
            </button>
          );
        })}
      </div>

      {tab === "tasks" && (
        <>
          <div className="mt-3 flex justify-end">
            <ChunkyButton
              type="button"
              color="grass"
              size="sm"
              disabled={adding}
              icon={<Plus size={14} />}
              onClick={() => void addTask()}
            >
              {adding ? "Adding…" : "Add task"}
            </ChunkyButton>
          </div>
          <div
            className="kz-sticker mt-3 rounded-3xl p-1"
            style={{ ["--ink" as never]: PALETTE.ink }}
          >
            <ul>
              {tasks.length === 0 && (
                <li className="px-3 py-8 text-center font-hand text-sm" style={{ color: PALETTE.ink, opacity: 0.6 }}>
                  No tasks yet — tap Add task.
                </li>
              )}
              {tasks.map((t) => {
                const doneToday = t.completed_at === today;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 border-t-2 border-dashed px-3 py-2.5 first:border-t-0"
                    style={{ borderColor: `${PALETTE.ink}18` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold" style={{ color: PALETTE.ink }}>
                        {t.task_name}
                      </div>
                      <div className="font-display text-xs opacity-60" style={{ color: PALETTE.ink }}>
                        +{t.points} pts
                        {doneToday ? " · done today" : ""}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${t.task_name}`}
                      onClick={() => setTaskDraft({ ...t })}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
                      style={{
                        background: "#fff",
                        border: `2px solid ${PALETTE.ink}`,
                        boxShadow: `0 2px 0 ${PALETTE.ink}`,
                        color: PALETTE.ink,
                      }}
                    >
                      <Pencil size={16} strokeWidth={2.4} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {tab === "quests" && (
        <>
          {quests.length !== WHEEL_SLICE_COUNT && (
            <div
              className="mt-3 rounded-2xl border-2 px-3 py-2 font-hand text-sm"
              style={{
                borderColor: PALETTE.sun,
                background: "rgba(255, 249, 220, 0.95)",
                color: PALETTE.ink,
              }}
            >
              Expected exactly {WHEEL_SLICE_COUNT} wheel quests (one per slice). This database has{" "}
              {quests.length}. Restore from backup or re-run migrations so the wheel stays in sync.
            </div>
          )}
          <div
            className="kz-sticker mt-3 rounded-3xl p-1"
            style={{ ["--ink" as never]: PALETTE.ink }}
          >
            <ul>
              {quests.length === 0 && (
                <li className="px-3 py-8 text-center font-hand text-sm" style={{ color: PALETTE.ink, opacity: 0.6 }}>
                  No wheel quests in the database — run the latest Supabase migrations.
                </li>
              )}
              {quests.map((q, sliceIdx) => (
                <li
                  key={q.id}
                  className="flex items-center gap-2 border-t-2 border-dashed px-3 py-2.5 first:border-t-0"
                  style={{ borderColor: `${PALETTE.ink}18` }}
                >
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-xs text-white"
                    style={{
                      background: `linear-gradient(180deg, ${PALETTE[q.accent]}, ${shade(PALETTE[q.accent], -12)})`,
                      border: `2px solid ${PALETTE.ink}`,
                      boxShadow: `0 2px 0 ${PALETTE.ink}`,
                    }}
                  >
                    {sliceIdx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[10px] tracking-wider opacity-55" style={{ color: PALETTE.ink }}>
                      SLICE {sliceIdx + 1} / {WHEEL_SLICE_COUNT}
                    </div>
                    <div className="truncate font-semibold" style={{ color: PALETTE.ink }}>
                      {q.title}
                    </div>
                    <div className="truncate font-hand text-xs opacity-65" style={{ color: PALETTE.ink }}>
                      {q.detail}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit ${q.title}`}
                    onClick={() => setQuestDraft({ ...q })}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
                    style={{
                      background: "#fff",
                      border: `2px solid ${PALETTE.ink}`,
                      boxShadow: `0 2px 0 ${PALETTE.ink}`,
                      color: PALETTE.ink,
                    }}
                  >
                    <Pencil size={16} strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "groups" && (
        <div className="mt-3">
          <div className="kz-sticker rounded-3xl p-4" style={{ ["--ink" as never]: PALETTE.ink }}>
            <div className="font-display text-xs tracking-wider opacity-60">MY GROUPS</div>
            <div className="mt-3 flex flex-col gap-2">
              {groups.length === 0 && (
                <p className="font-hand text-sm opacity-60">You aren&apos;t in any groups yet.</p>
              )}
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => void switchGroup(group.id)}
                  disabled={groupBusy}
                  className="flex items-center justify-between rounded-full px-4 py-2.5 text-left transition-transform active:scale-[0.98]"
                  style={{
                    background: activeGroupId === group.id ? PALETTE.sky : "#fff",
                    color: PALETTE.ink,
                    border: `2px solid ${PALETTE.ink}`,
                    boxShadow: `0 3px 0 ${PALETTE.ink}`,
                  }}
                >
                  <span className="font-display text-sm">{group.name}</span>
                  {activeGroupId === group.id && <span className="font-hand text-xs font-bold">active</span>}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="font-display text-xs tracking-wider opacity-60">CREATE OR JOIN</div>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group name (e.g. Miller Family)"
                    className="rounded-xl border-2 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: PALETTE.ink }}
                  />
                  <ChunkyButton type="button" color="sun" size="sm" full disabled={groupBusy} onClick={() => void createGroup()}>
                    Create new group
                  </ChunkyButton>
                </div>

                <div className="relative my-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-current opacity-10" />
                  <span className="font-display text-[10px] opacity-40">OR</span>
                  <div className="h-px flex-1 bg-current opacity-10" />
                </div>

                <div className="grid gap-2">
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Invite code"
                    className="rounded-xl border-2 px-3 py-2 text-sm outline-none"
                    style={{ borderColor: PALETTE.ink }}
                  />
                  <ChunkyButton type="button" color="grass" size="sm" full disabled={groupBusy || !inviteCode.trim()} onClick={() => void joinGroup()}>
                    Join with code
                  </ChunkyButton>
                </div>
              </div>
            </div>

            {groups.length > 0 && (
              <div className="mt-6 border-t-2 border-dashed pt-4" style={{ borderColor: `${PALETTE.ink}15` }}>
                <ChunkyButton
                  type="button"
                  color="white"
                  size="sm"
                  full
                  disabled={groupBusy || !activeGroupId}
                  onClick={() => activeGroupId && void leaveGroup(activeGroupId)}
                >
                  Leave active group
                </ChunkyButton>
              </div>
            )}
            {groupStatus && (
              <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold" style={{ color: PALETTE.ink, border: `1.5px solid ${PALETTE.sky}` }}>
                {groupStatus}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div
          className="mt-4 rounded-3xl border-2 px-4 py-4"
          style={{
            borderColor: PALETTE.ink,
            background: "rgba(255,255,255,0.88)",
            boxShadow: `0 3px 0 ${PALETTE.ink}`,
          }}
        >
          <div className="font-display text-sm tracking-wide" style={{ color: PALETTE.ink }}>
            PUSH NOTIFICATIONS
          </div>
          <p className="font-hand mt-1 text-xs leading-snug opacity-80" style={{ color: PALETTE.ink }}>
            Sends a test alert to this browser if you already enabled chat alerts (Chat → Get alerts for new messages).
          </p>
          <div className="mt-3">
            <ChunkyButton
              type="button"
              color="sky"
              size="sm"
              disabled={pushTestBusy}
              icon={<Bell size={14} />}
              onClick={() => void sendTestPush()}
            >
              {pushTestBusy ? "Sending…" : "Send test notification"}
            </ChunkyButton>
          </div>
          {pushTestOk && (
            <p className="font-hand mt-2 text-xs font-medium leading-snug" style={{ color: PALETTE.grass }}>
              {pushTestOk}
            </p>
          )}
        </div>
      )}

      {taskDraft && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          onClick={() => setTaskDraft(null)}
        >
          <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
            <div
              className="kz-sticker my-auto w-full max-w-md max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-[24px] p-4"
              style={{ ["--ink" as never]: PALETTE.ink }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="font-display text-lg" style={{ color: PALETTE.ink }}>
                Edit task
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setTaskDraft(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{
                  background: "#fff",
                  border: `2px solid ${PALETTE.ink}`,
                  boxShadow: `0 2px 0 ${PALETTE.ink}`,
                  color: PALETTE.ink,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <label className="block">
              <span className="font-display text-[10px] tracking-wider opacity-60">NAME</span>
              <input
                value={taskDraft.task_name}
                onChange={(e) => setTaskDraft({ ...taskDraft, task_name: e.target.value })}
                className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
              />
            </label>

            <label className="mt-3 block">
              <span className="font-display text-[10px] tracking-wider opacity-60">POINTS</span>
              <input
                type="number"
                min={1}
                max={99}
                disabled={taskDraft.completed_at === today}
                value={taskDraft.points}
                onChange={(e) =>
                  setTaskDraft({
                    ...taskDraft,
                    points: Math.max(1, Math.min(99, Number(e.target.value) || 1)),
                  })
                }
                className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none disabled:opacity-45"
                style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
              />
            </label>
            {taskDraft.completed_at === today && (
              <p className="mt-1 font-hand text-xs" style={{ color: PALETTE.ink, opacity: 0.65 }}>
                Done today — uncheck on Today to change points.
              </p>
            )}

            <label className="mt-3 block">
              <span className="font-display text-[10px] tracking-wider opacity-60">ORDER</span>
              <input
                type="number"
                value={taskDraft.sort_order}
                onChange={(e) =>
                  setTaskDraft({
                    ...taskDraft,
                    sort_order: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
              />
            </label>

            <div className="mt-4 flex flex-col gap-2">
              <ChunkyButton type="button" color="blush" full onClick={() => void saveTaskFromDraft(taskDraft)}>
                Save
              </ChunkyButton>
              <ChunkyButton
                type="button"
                color="white"
                full
                icon={<Trash2 size={16} />}
                onClick={() => void deleteTaskRow(taskDraft)}
              >
                Delete
              </ChunkyButton>
            </div>
            </div>
          </div>
        </div>
      )}

      {questDraft && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          onClick={() => setQuestDraft(null)}
        >
          <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
            <div
              className="kz-sticker my-auto w-full max-w-md max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-[24px] p-4"
              style={{ ["--ink" as never]: PALETTE.ink }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-lg" style={{ color: PALETTE.ink }}>
                  Edit wheel slice
                </div>
                <div className="font-hand text-sm opacity-70" style={{ color: PALETTE.ink }}>
                  {WHEEL_SLICE_COUNT} slices total — text & colors only.
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setQuestDraft(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{
                  background: "#fff",
                  border: `2px solid ${PALETTE.ink}`,
                  boxShadow: `0 2px 0 ${PALETTE.ink}`,
                  color: PALETTE.ink,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-1">
                <span className="font-display text-[10px] tracking-wider opacity-60">TAG</span>
                <input
                  value={questDraft.tag}
                  onChange={(e) => setQuestDraft({ ...questDraft, tag: e.target.value })}
                  className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                  style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                />
              </label>
              <label className="block sm:col-span-1">
                <span className="font-display text-[10px] tracking-wider opacity-60">ACCENT</span>
                <select
                  value={questDraft.accent}
                  onChange={(e) =>
                    setQuestDraft({ ...questDraft, accent: e.target.value as AccentColor })
                  }
                  className="mt-1 w-full rounded-xl border-2 bg-white px-2 py-2 font-body text-sm outline-none"
                  style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                >
                  {ACCENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="font-display text-[10px] tracking-wider opacity-60">TITLE</span>
                <input
                  value={questDraft.title}
                  onChange={(e) => setQuestDraft({ ...questDraft, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                  style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="font-display text-[10px] tracking-wider opacity-60">DETAIL</span>
                <textarea
                  value={questDraft.detail}
                  onChange={(e) => setQuestDraft({ ...questDraft, detail: e.target.value })}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                  style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="font-display text-[10px] tracking-wider opacity-60">
                  SLICE ORDER (0–{WHEEL_SLICE_COUNT - 1}, clockwise)
                </span>
                <input
                  type="number"
                  min={0}
                  max={WHEEL_SLICE_COUNT - 1}
                  value={questDraft.sort_order}
                  onChange={(e) =>
                    setQuestDraft({
                      ...questDraft,
                      sort_order: Math.max(
                        0,
                        Math.min(WHEEL_SLICE_COUNT - 1, Number(e.target.value) || 0),
                      ),
                    })
                  }
                  className="mt-1 w-full rounded-xl border-2 bg-white px-3 py-2 font-body text-sm outline-none"
                  style={{ borderColor: PALETTE.ink, color: PALETTE.ink }}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <ChunkyButton type="button" color="blush" full onClick={() => void saveQuestFromDraft(questDraft)}>
                Save
              </ChunkyButton>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
