"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { ChevronLeft, MessageCircle } from "lucide-react";
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
  activeGroupName: string | null;
};

export function Header({
  userId,
  userEmail,
  displayName,
  avatarEmoji,
  accentColor,
  activeGroupName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { hasUnreadChat } = useChatUnread();
  const showBackButton =
    pathname === "/chat" || pathname.startsWith("/chat/") || pathname === "/administration";

  const handleBack = useCallback(() => {
    if (window.history.state?.idx > 0) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

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
        {activeGroupName && (
          <div
            className="font-display hidden max-w-[140px] truncate rounded-full bg-white px-2.5 py-1 text-xs sm:block"
            style={{
              color: PALETTE.ink,
              border: `2px solid ${PALETTE.ink}`,
              boxShadow: `0 2px 0 ${PALETTE.ink}`,
            }}
          >
            {activeGroupName}
          </div>
        )}

        <div className="flex items-center gap-2">
          {showBackButton ? (
            <button
              type="button"
              onClick={handleBack}
              className="kz-chunky font-display inline-flex items-center justify-center gap-0"
              style={{
                height: 40,
                paddingLeft: 6,
                paddingRight: 14,
                paddingTop: 0,
                paddingBottom: 0,
                background: "#fff",
                color: PALETTE.ink,
                borderRadius: 999,
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.6} className="-mr-0.5 shrink-0" />
              <span className="text-[13px] font-semibold leading-none tracking-wide">Back</span>
            </button>
          ) : (
            <>
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
            </>
          )}
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
