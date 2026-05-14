"use client";

import { useEffect, useMemo, useState } from "react";
import { X, LogOut, Save } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { createClient } from "@/lib/supabase/client";
import { PALETTE } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string | null;
  initialDisplayName: string;
};

export function ProfileSheet({
  open,
  onClose,
  userId,
  userEmail,
  initialDisplayName,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState(initialDisplayName);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    if (open) {
      setName(initialDisplayName);
      setStatus("idle");
    }
  }, [open, initialDisplayName]);

  if (!open) return null;

  async function save() {
    setSaving(true);
    setStatus("idle");
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() || null })
      .eq("id", userId);
    setSaving(false);
    setStatus(error ? "error" : "saved");
    if (!error) {
      // Hard refresh so server components pick up the new name.
      window.setTimeout(() => {
        onClose();
        window.location.reload();
      }, 400);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 pt-12 sm:items-center"
      style={{ background: "rgba(19,41,75,0.4)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="kz-sticker relative w-full max-w-md rounded-[28px] p-5"
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

        <div className="font-display text-[22px]" style={{ color: PALETTE.ink }}>
          YOUR PROFILE
        </div>
        <div className="font-hand text-lg" style={{ color: PALETTE.ink, opacity: 0.6 }}>
          {userEmail || "signed in"}
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

        {status === "error" && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            Couldn&apos;t save — try again?
          </p>
        )}
        {status === "saved" && (
          <p className="mt-2 text-sm font-semibold" style={{ color: PALETTE.grass }}>
            Saved!
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          <ChunkyButton
            type="button"
            color="blush"
            full
            disabled={saving || !name.trim()}
            onClick={save}
            icon={<Save size={16} strokeWidth={2.4} />}
          >
            {saving ? "Saving…" : "Save"}
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
  );
}
