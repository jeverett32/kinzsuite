import type { ReactNode } from "react";
import { PALETTE, type PaletteColor } from "@/lib/utils";

export function Chip({ children, tone = "sky" }: { children: ReactNode; tone?: PaletteColor }) {
  const c = PALETTE[tone];
  return (
    <span
      className="font-display text-[11px] uppercase tracking-wider text-white lowercase"
      style={{
        background: c,
        padding: "4px 10px",
        borderRadius: 999,
        border: `2px solid ${PALETTE.ink}`,
        boxShadow: `0 2px 0 ${PALETTE.ink}`,
        textTransform: "lowercase",
      }}
    >
      {children}
    </span>
  );
}
