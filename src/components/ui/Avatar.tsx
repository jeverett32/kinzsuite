import { PALETTE, shade, type PaletteColor } from "@/lib/utils";
import type { AccentColor } from "@/lib/supabase/types";

type Props = {
  emoji: string;
  color: AccentColor | PaletteColor;
  size?: number;
  rounded?: number;
  border?: boolean;
  halo?: boolean;
};

export function Avatar({
  emoji,
  color,
  size = 56,
  rounded = 999,
  border = true,
  halo = true,
}: Props) {
  const bg = PALETTE[color as PaletteColor];
  const light = shade(bg, 35);
  const dark = shade(bg, -15);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        background: `radial-gradient(120% 100% at 30% 20%, ${light} 0%, ${bg} 55%, ${dark} 100%)`,
        boxShadow: halo
          ? "inset 0 0 0 4px rgba(255,255,255,0.55), inset 0 -8px 24px rgba(0,0,0,0.05)"
          : "none",
        border: border ? `2.5px solid ${PALETTE.ink}` : "none",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.55),
        lineHeight: 1,
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))",
      }}
    >
      <span style={{ filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.18))" }}>{emoji}</span>
    </div>
  );
}

export const AVATAR_EMOJIS: string[] = [
  "🙂", "😊", "🥰", "😎", "🤓", "😺",
  "🐶", "🐱", "🦊", "🐰", "🐻", "🐸",
  "🦉", "🦆", "🐼", "🦄", "🐝", "🐧",
  "⭐", "🌟", "☀️", "🌙", "⚡", "🔥",
  "🌸", "🌷", "🍰", "🍓", "💖", "✨",
];

export const ACCENT_COLOR_OPTIONS: AccentColor[] = [
  "sky",
  "blush",
  "sun",
  "grass",
  "purple",
];
