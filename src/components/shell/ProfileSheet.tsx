"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, LogOut, Save, Settings } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { Avatar, AVATAR_EMOJIS, ACCENT_COLOR_OPTIONS } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade } from "@/lib/utils";
import type { AccentColor } from "@/lib/supabase/types";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string | null;
  initialDisplayName: string;
  initialAvatarEmoji: string;
  initialAccentColor: AccentColor;
};

export function ProfileSheet({
  open,
  onClose,
  userId,
  userEmail,
  initialDisplayName,
  initialAvatarEmoji,
  initialAccentColor,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialDisplayName);
  const [emoji, setEmoji] = useState(initialAvatarEmoji);
  const [color, setColor] = useState<AccentColor>(initialAccentColor);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);
  const [groupStatus, setGroupStatus] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    const [{ data: memberships }, { data: profile }] = await Promise.all([
      supabase.from("group_members").select("group_id").eq("user_id", userId),
      supabase.from("profiles").select("active_group_id").eq("id", userId).maybeSingle(),
    ]);
    const ids = [...new Set((memberships ?? []).map((row) => row.group_id))];
    const { data: groupRows } = ids.length
      ? await supabase.from("groups").select("id, name").in("id", ids)
      : { data: [] as { id: string; name: string }[] };
    setGroups(groupRows ?? []);
    setActiveGroupId(profile?.active_group_id ?? null);
  }, [supabase, userId]);

  useEffect(() => {
    if (open) {
      setName(initialDisplayName);
      setEmoji(initialAvatarEmoji);
      setColor(initialAccentColor);
      setStatus("idle");
      void loadGroups();
    }
  }, [open, initialDisplayName, initialAvatarEmoji, initialAccentColor, loadGroups]);

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
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    if (!error && activeGroupId === groupId) {
      await supabase.from("profiles").update({ active_group_id: null }).eq("id", userId);
    }
    setGroupBusy(false);
    if (error) {
      setGroupStatus(error.message);
      return;
    }
    await loadGroups();
    window.location.reload();
  }

  if (!open) return null;

  async function save() {
    setSaving(true);
    setStatus("idle");
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim() || null,
        avatar_emoji: emoji,
        accent_color: color,
      })
      .eq("id", userId);
    setSaving(false);
    setStatus(error ? "error" : "saved");
    if (!error) {
      window.setTimeout(() => {
        onClose();
        window.location.reload();
      }, 400);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <div className="flex min-h-[100dvh] flex-col items-center px-4 py-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="kz-sticker relative my-auto w-full max-w-md max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-[28px] p-5"
          style={{ ["--ink" as never]: PALETTE.ink }}
        >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full"
          style={{
            background: "#fff",
            border: `2px solid ${PALETTE.ink}`,
            boxShadow: `0 2px 0 ${PALETTE.ink}`,
            color: PALETTE.ink,
          }}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <Avatar emoji={emoji} color={color} size={64} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[22px]" style={{ color: PALETTE.ink }}>
              YOUR PROFILE
            </div>
            <div
              className="font-hand truncate text-base"
              style={{ color: PALETTE.ink, opacity: 0.6 }}
            >
              {userEmail || "signed in"}
            </div>
          </div>
        </div>

        <label className="mt-4 block">
          <div
            className="font-display mb-1 text-[11px] tracking-wider"
            style={{ color: PALETTE.ink, opacity: 0.6 }}
          >
            DISPLAY NAME
          </div>
          <div
            className="rounded-full bg-white px-3.5 py-2"
            style={{
              border: `2.5px solid ${PALETTE.ink}`,
              boxShadow: `0 3px 0 ${PALETTE.ink}`,
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jess"
              className="font-body w-full bg-transparent outline-none"
              style={{ color: PALETTE.ink }}
              maxLength={40}
            />
          </div>
        </label>

        <div className="mt-3">
          <div
            className="font-display mb-1.5 text-[11px] tracking-wider"
            style={{ color: PALETTE.ink, opacity: 0.6 }}
          >
            COLOR
          </div>
          <div className="flex gap-2">
            {ACCENT_COLOR_OPTIONS.map((c) => {
              const bg = PALETTE[c];
              const active = color === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className="grid place-items-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: `linear-gradient(180deg, ${bg}, ${shade(bg, -15)})`,
                    border: `2.5px solid ${PALETTE.ink}`,
                    boxShadow: active
                      ? `0 4px 0 ${PALETTE.ink}`
                      : `0 2px 0 ${PALETTE.ink}`,
                    transform: active ? "translateY(-2px)" : "translateY(0)",
                    cursor: "pointer",
                  }}
                >
                  {active && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#fff",
                        border: `2px solid ${PALETTE.ink}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-[22px] bg-white p-3" style={{ border: `2.5px solid ${PALETTE.ink}`, boxShadow: `0 3px 0 ${PALETTE.ink}` }}>
          <div className="font-display text-xs tracking-wider" style={{ color: PALETTE.ink, opacity: 0.65 }}>
            GROUPS
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => void switchGroup(group.id)}
                disabled={groupBusy}
                className="flex items-center justify-between rounded-full px-3 py-2 text-left"
                style={{
                  background: activeGroupId === group.id ? PALETTE.sky : "#fff",
                  color: PALETTE.ink,
                  border: `2px solid ${PALETTE.ink}`,
                  boxShadow: `0 2px 0 ${PALETTE.ink}`,
                }}
              >
                <span className="font-display text-sm">{group.name}</span>
                {activeGroupId === group.id && <span className="font-hand text-xs">active</span>}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name"
              className="rounded-full px-3 py-2 text-sm outline-none"
              style={{ border: `2px solid ${PALETTE.ink}` }}
            />
            <ChunkyButton type="button" color="sun" full disabled={groupBusy} onClick={() => void createGroup()}>
              Create group
            </ChunkyButton>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Invite code"
              className="rounded-full px-3 py-2 text-sm outline-none"
              style={{ border: `2px solid ${PALETTE.ink}` }}
            />
            <ChunkyButton type="button" color="grass" full disabled={groupBusy || !inviteCode.trim()} onClick={() => void joinGroup()}>
              Join group
            </ChunkyButton>
          </div>
          {groups.length > 0 && (
            <div className="mt-3">
              <ChunkyButton
                type="button"
                color="white"
                full
                disabled={groupBusy || !activeGroupId}
                onClick={() => activeGroupId && void leaveGroup(activeGroupId)}
              >
                Leave active group
              </ChunkyButton>
            </div>
          )}
          {groupStatus && <p className="mt-2 text-xs font-semibold" style={{ color: PALETTE.ink }}>{groupStatus}</p>}
        </div>

        <div className="mt-3">
          <div
            className="font-display mb-1.5 text-[11px] tracking-wider"
            style={{ color: PALETTE.ink, opacity: 0.6 }}
          >
            EMOJI
          </div>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_EMOJIS.map((e) => {
              const active = emoji === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  aria-label={e}
                  className="grid place-items-center"
                  style={{
                    aspectRatio: "1",
                    borderRadius: 14,
                    border: `2.5px solid ${PALETTE.ink}`,
                    background: active ? `${PALETTE[color]}30` : "#fff",
                    boxShadow: active
                      ? `0 3px 0 ${PALETTE.ink}`
                      : `0 2px 0 ${PALETTE.ink}`,
                    fontSize: 22,
                    cursor: "pointer",
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </div>

        {status === "error" && (
          <p className="mt-3 text-sm font-semibold text-red-600">
            Couldn&apos;t save — try again?
          </p>
        )}
        {status === "saved" && (
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: PALETTE.grass }}
          >
            Saved!
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <ChunkyButton
            type="button"
            color="blush"
            full
            disabled={saving}
            onClick={save}
            icon={<Save size={16} strokeWidth={2.4} />}
          >
            {saving ? "Saving…" : "Save"}
          </ChunkyButton>
          <ChunkyButton
            type="button"
            color="sky"
            full
            icon={<Settings size={16} strokeWidth={2.4} />}
            onClick={() => {
              onClose();
              router.push("/administration");
            }}
          >
            Administration
          </ChunkyButton>
          <form action="/auth/sign-out" method="post">
            <ChunkyButton
              type="submit"
              color="sun"
              full
              icon={<LogOut size={16} strokeWidth={2.4} />}
            >
              Sign out
            </ChunkyButton>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
