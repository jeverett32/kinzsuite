"use client";

import { PawPrint } from "lucide-react";
import { PALETTE, shade, type PaletteColor } from "@/lib/utils";

type Side = "me" | "partner";

export function PartnerToggle({
  value,
  onChange,
  meName,
  partnerName,
  noun = "pets",
}: {
  value: Side;
  onChange: (v: Side) => void;
  meName: string;
  partnerName: string;
  noun?: string;
}) {
  const options: { id: Side; label: string; tone: PaletteColor }[] = [
    { id: "me", label: `${meName}'s ${noun}`, tone: "sky" },
    { id: "partner", label: `${partnerName}'s ${noun}`, tone: "blush" },
  ];
  return (
    <div className="flex w-full gap-2">
      {options.map((o) => {
        const active = value === o.id;
        const c = PALETTE[o.tone];
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="kz-chunky font-display flex-1"
            style={{
              background: active
                ? `linear-gradient(180deg, ${c}, ${shade(c, -15)})`
                : "linear-gradient(180deg, #fff, #F2F8FF)",
              color: active ? "#fff" : PALETTE.ink,
              fontSize: 15,
              padding: "12px 16px",
              transform: active ? "translateY(0)" : "translateY(2px)",
              opacity: active ? 1 : 0.85,
            }}
          >
            <span className="inline-flex items-center gap-2">
              <PawPrint size={18} strokeWidth={2.4} />
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
