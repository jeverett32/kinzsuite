"use client";

import Link from "next/link";
import { MessageCircle, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PALETTE, shade } from "@/lib/utils";

export function Header() {
  return (
    <header className="relative z-30 flex items-center justify-between gap-2 px-3.5 pt-12 pb-1.5">
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
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            aria-label="Sign out"
            className="kz-chunky font-display grid place-items-center"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              background: `linear-gradient(180deg, ${PALETTE.sun}, ${shade(PALETTE.sun, -15)})`,
              color: PALETTE.ink,
            }}
          >
            <LogOut size={18} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </header>
  );
}
