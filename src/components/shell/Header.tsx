"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileSheet } from "@/components/shell/ProfileSheet";
import { useChatUnread } from "@/components/shell/ChatUnreadContext";
import { PALETTE, shade } from "@/lib/utils";
import type { AccentColor } from "@/lib/supabase/types";

type Props = {
  userId: string;
  userEmail: string | null;
  displayName: string;
  avatarEmoji: string;
  accentColor: AccentColor;
};

export function Header({
  userId,
  userEmail,
  displayName,
  avatarEmoji,
  accentColor,
}: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { hasUnreadChat } = useChatUnread();

  return (
    <>
      <header
        className="relative z-30 flex items-center justify-between gap-2 px-3.5 pb-1.5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 14px)" }}
      >
        <div
          className="inline-flex items-center gap-2 bg-white pl-1.5 pr-3.5 py-1.5"
          style={{
            borderRadius: 999,
            border: `2.5px solid ${PALETTE.ink}`,
            boxShadow: `0 4px 0 ${PALETTE.ink}`,
          }}
        >
          <Logo size={32} />
          <span
            className="font-display text-lg leading-none"
            style={{ color: PALETTE.ink }}
          >
            Kinz<span style={{ color: PALETTE.blush }}>Suite</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            aria-label={hasUnreadChat ? "Chat, unread messages" : "Chat"}
            className="kz-chunky font-display relative grid place-items-center"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              background: `linear-gradient(180deg, ${PALETTE.blush}, ${shade(PALETTE.blush, -15)})`,
              color: "#fff",
            }}
          >
            <MessageCircle size={18} strokeWidth={2.4} />
            {hasUnreadChat ? (
              <span
                className="absolute"
                style={{
                  top: 4,
                  right: 4,
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: PALETTE.sun,
                  border: `2px solid ${PALETTE.ink}`,
                  boxShadow: `0 1px 0 ${PALETTE.ink}`,
                }}
              />
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profile"
            className="grid place-items-center"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              borderRadius: 999,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              boxShadow: `0 3px 0 ${PALETTE.ink}`,
            }}
          >
            <Avatar emoji={avatarEmoji} color={accentColor} size={40} />
          </button>
        </div>
      </header>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userId={userId}
        userEmail={userEmail}
        initialDisplayName={displayName}
        initialAvatarEmoji={avatarEmoji}
        initialAccentColor={accentColor}
      />
    </>
  );
}
