"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

type Client = ReturnType<typeof createBrowserClient<Database>>;

let singleton: Client | null = null;

/**
 * Returns the process-wide Supabase browser client. One client = one auth
 * refresh loop, one realtime WebSocket. Mounting many components no longer
 * spawns parallel sockets.
 */
export function createClient(): Client {
  if (singleton) return singleton;
  singleton = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return singleton;
}
