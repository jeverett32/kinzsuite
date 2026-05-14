"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn, PALETTE, shade, contrastInk, type PaletteColor } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: PaletteColor | "white";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  icon?: ReactNode;
};

export const ChunkyButton = forwardRef<HTMLButtonElement, Props>(function ChunkyButton(
  { color = "sun", size = "md", full, icon, className, style, children, ...rest },
  ref,
) {
  const c = color === "white" ? "#ffffff" : PALETTE[color];
  const pad = size === "lg" ? "14px 24px" : size === "sm" ? "7px 14px" : "10px 18px";
  const fontSize = size === "lg" ? 17 : size === "sm" ? 12 : 14;
  return (
    <button
      ref={ref}
      className={cn("kz-chunky font-display inline-flex items-center justify-center gap-2", className)}
      style={{
        background: `linear-gradient(180deg, ${c} 0%, ${c} 60%, ${shade(c, -10)} 100%)`,
        color: contrastInk(c),
        padding: pad,
        fontSize,
        width: full ? "100%" : "auto",
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
