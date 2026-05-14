import type { AccentColor } from "@/lib/supabase/types";

/** Date-wheel card (DB `wheel_quests` or local fallback). */
export type Quest = {
  id?: string;
  tag: string;
  title: string;
  detail: string;
  accent: AccentColor;
};

/** Used only when `wheel_quests` is empty (e.g. migration not applied yet). */
export const STATIC_QUESTS_FALLBACK: Quest[] = [
  { tag: "Arcade", title: "Beat your high score in Cash Cow Returns", detail: "Loser owes the winner a backrub.", accent: "sun" },
  { tag: "Garden", title: "Plant a brand-new flowerbed together", detail: "Bonus: pick a color you've never used.", accent: "grass" },
  { tag: "Cooking", title: "Bake heart-shaped sugar cookies", detail: "Frost each other's pet on top.", accent: "blush" },
  { tag: "Adventure", title: "Hike to a spot you've never visited", detail: "Take a polaroid for the gallery.", accent: "sky" },
  { tag: "Cozy", title: "Build a blanket fort and pick a movie", detail: "Loser of rock-paper-scissors picks snacks.", accent: "blush" },
  { tag: "Music", title: "Slow dance to one full song", detail: "No phones. Eye contact required.", accent: "sun" },
  { tag: "Quest", title: "Trade three pet outfits with each other", detail: "Style your partner's pet for tomorrow.", accent: "grass" },
  { tag: "Travel", title: "Plan a 24-hr surprise trip on paper", detail: "Reveal at breakfast on Saturday.", accent: "sky" },
];

/** Wheel uses one slice per quest row; keep this many rows in the database. */
export const WHEEL_SLICE_COUNT = STATIC_QUESTS_FALLBACK.length;
