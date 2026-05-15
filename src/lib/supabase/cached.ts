import { cache } from "react";
import { createClient } from "./server";
import type { Profile } from "./types";

/**
 * Per-request cached helpers. React's `cache()` dedupes calls within a single
 * server render so a layout + page asking for the same data only hits Supabase
 * once.
 */

export const getSession = cache(async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
});

export const getAllProfiles = cache(async (): Promise<Profile[]> => {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*");
  return data ?? [];
});
