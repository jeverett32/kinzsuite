"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ProfileSheet } from "@/components/shell/ProfileSheet";
import { PALETTE, shade } from "@/lib/utils";

type Props = {
  userId: string;
  userEmail: string | null;
  displayName: string;
};

export function Header({ userId, userEmail, displayName }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

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
          <span className="font-display text-lg leading-none" style={{ color: PALETTE.ink }}>
            Kinz<span style={{ color: PALETTE.blush }}>Suite</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/chat"
            aria-label="Chat"
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
          </Link>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Profile"
            className="kz-chunky font-display grid place-items-center"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              background: `linear-gradient(180deg, ${PALETTE.sun}, ${shade(PALETTE.sun, -15)})`,
              color: PALETTE.ink,
            }}
          >
            <User size={18} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        userId={userId}
        userEmail={userEmail}
        initialDisplayName={displayName}
      />
    </>
  );
}
