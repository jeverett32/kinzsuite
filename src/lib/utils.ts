import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lightens (positive) or darkens (negative) a hex color by a percentage. */
export function shade(hex: string, percent: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.max(0, Math.min(255, r + Math.round(((255 - r) * percent) / 100)));
  g = Math.max(0, Math.min(255, g + Math.round(((255 - g) * percent) / 100)));
  b = Math.max(0, Math.min(255, b + Math.round(((255 - b) * percent) / 100)));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function contrastInk(bg: string, ink = "#13294B"): string {
  const n = parseInt(bg.replace("#", ""), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? ink : "#fff";
}

export const PALETTE = {
  sky: "#3FB8E8",
  sun: "#FFC93C",
  grass: "#7BC043",
  blush: "#FF6FA3",
  purple: "#A05CFF",
  cream: "#EAF6FF",
  ink: "#13294B",
} as const;

export type PaletteColor = keyof typeof PALETTE;

export const PET_TYPES: { type: string; aColor: string; bColor: string; ear: string; face: string }[] = [
  { type: "Cloud Pup",    aColor: "#A6DFFF", bColor: "#FFFFFF", ear: "#9CCFEF", face: "🐶" },
  { type: "Sunny Cat",    aColor: "#FFE6A6", bColor: "#FFF3CC", ear: "#F5C97D", face: "🐱" },
  { type: "Mossy Bear",   aColor: "#C7E89A", bColor: "#E8F3CD", ear: "#9CC472", face: "🐻" },
  { type: "Bubble Bunny", aColor: "#FFC9DD", bColor: "#FFE3EF", ear: "#F39FBE", face: "🐰" },
  { type: "Pond Frog",    aColor: "#A4E5C5", bColor: "#D3F2DF", ear: "#7DD0AA", face: "🐸" },
  { type: "Sock Fox",     aColor: "#FFB892", bColor: "#FFD9C2", ear: "#F09368", face: "🦊" },
  { type: "Dusty Owl",    aColor: "#D7C7FF", bColor: "#ECE2FF", ear: "#B9A2F0", face: "🦉" },
  { type: "Puddle Duck",  aColor: "#FFE291", bColor: "#FFF1BE", ear: "#F2C859", face: "🦆" },
];
