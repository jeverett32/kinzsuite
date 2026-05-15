"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on idle. The SW caches Supabase storage GETs (stale-
 * while-revalidate) and handles web-push. Registration is deferred so it
 * never competes with first paint or hydration.
 */
export function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const run = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    const ric = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (ric) ric(run, { timeout: 2000 });
    else setTimeout(run, 800);
  }, []);
  return null;
}
