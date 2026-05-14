"use client";

import { useCallback, useEffect, useState } from "react";
import { PALETTE, shade } from "@/lib/utils";

type Mode = "checking" | "cta" | "ios_add_to_home" | "hidden" | "busy" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

async function postSubscription(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  return res.ok;
}

export function ChatPushNotificationsBar() {
  const [mode, setMode] = useState<Mode>("checking");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setMode("hidden");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setMode("hidden");
      return;
    }

    void (async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        setMode("error");
        return;
      }

      if (!("PushManager" in window)) {
        if (isIos() && !isStandaloneDisplay()) setMode("ios_add_to_home");
        else setMode("hidden");
        return;
      }

      const perm = Notification.permission;
      if (perm === "denied") {
        setMode("hidden");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing && perm === "granted") {
        const ok = await postSubscription(existing);
        setMode(ok ? "hidden" : "cta");
        return;
      }

      if (perm === "granted" && !existing) {
        setMode("cta");
        return;
      }

      setMode("cta");
    })();
  }, []);

  const enable = useCallback(async () => {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) return;
    setMode("busy");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setMode("hidden");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        });
      }
      const ok = await postSubscription(sub);
      setMode(ok ? "hidden" : "error");
    } catch {
      setMode("error");
    }
  }, []);

  if (mode === "hidden" || mode === "checking") return null;

  if (mode === "ios_add_to_home") {
    return (
      <p
        className="font-body px-3.5 pb-2 text-xs font-medium leading-snug"
        style={{ color: PALETTE.ink, opacity: 0.88 }}
      >
        On iPhone, add KinzSuite to your Home Screen and open that app, then tap below so we can alert you to new
        messages when you are not here.
      </p>
    );
  }

  if (mode === "error") {
    return (
      <p className="font-body px-3.5 pb-2 text-xs font-medium" style={{ color: PALETTE.ink }}>
        Could not enable alerts. Try again in a moment.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3.5 pb-2">
      <button
        type="button"
        disabled={mode === "busy"}
        onClick={() => void enable()}
        className="font-body rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{
          background: `linear-gradient(180deg, ${PALETTE.grass}, ${shade(PALETTE.grass, -12)})`,
          color: "#fff",
          border: `2px solid ${PALETTE.ink}`,
          boxShadow: `0 2px 0 ${PALETTE.ink}`,
          opacity: mode === "busy" ? 0.65 : 1,
        }}
      >
        {mode === "busy" ? "…" : "Get alerts for new messages"}
      </button>
    </div>
  );
}
