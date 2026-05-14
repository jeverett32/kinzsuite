"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, PawPrint, Heart, MessageCircle, type LucideIcon } from "lucide-react";
import { PALETTE, shade, type PaletteColor } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: PaletteColor;
};

const TABS: Tab[] = [
  { href: "/",      label: "Today", icon: CheckSquare,    tone: "grass" },
  { href: "/pets",  label: "Pets",  icon: PawPrint,       tone: "sky" },
  { href: "/date",  label: "Date",  icon: Heart,          tone: "blush" },
  { href: "/chat",  label: "Chat",  icon: MessageCircle,  tone: "purple" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-40 flex justify-around gap-1 px-2.5 pt-2.5 pb-[max(env(safe-area-inset-bottom),18px)]"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: `2.5px solid ${PALETTE.ink}`,
        boxShadow: "0 -10px 24px -10px rgba(19,41,75,0.18)",
      }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
        const c = PALETTE[t.tone];
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex flex-1 flex-col items-center gap-1 py-0"
          >
            <div
              className="grid place-items-center transition-transform"
              style={{
                width: 56,
                height: 38,
                borderRadius: 99,
                background: active ? `linear-gradient(180deg, ${c}, ${shade(c, -15)})` : "#fff",
                color: active ? "#fff" : PALETTE.ink,
                border: `2.5px solid ${PALETTE.ink}`,
                boxShadow: active
                  ? `0 3px 0 ${PALETTE.ink}, inset 0 -4px 0 -1px rgba(0,0,0,0.18), inset 0 3px 0 -1px rgba(255,255,255,0.4)`
                  : `0 2px 0 ${PALETTE.ink}`,
                transform: active ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <Icon size={20} strokeWidth={2.4} />
            </div>
            <span
              className="font-display text-[11px]"
              style={{
                color: active ? c : PALETTE.ink,
                letterSpacing: 0.6,
                opacity: active ? 1 : 0.7,
              }}
            >
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
