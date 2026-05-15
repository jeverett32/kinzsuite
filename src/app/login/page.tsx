"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, UserPlus } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { SkyBackground } from "@/components/ui/SkyBackground";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { PALETTE } from "@/lib/utils";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = createClient();
    setBusy(true);

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (error) {
        setError("That didn't work. Check your email and password.");
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    const redirectUrl = new URL("/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("next", "/");
    redirectUrl.searchParams.set("mode", "create-account");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
        emailRedirectTo: redirectUrl.toString(),
      },
    });
    setBusy(false);
    if (error) {
      setError("That didn't work. Check your details and try again.");
      return;
    }
    router.replace(`/login?next=${encodeURIComponent("/")}`);
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <SkyBackground showGrass />

      <div
        className="kz-sticker relative z-10 w-full max-w-sm rounded-[28px] p-6 text-center"
        style={{ ["--ink" as never]: PALETTE.ink }}
      >
        <div className="mx-auto mb-3 flex items-center justify-center gap-2">
          <Logo size={40} />
        </div>
        <div className="font-display text-3xl" style={{ color: PALETTE.ink }}>
          Kinz<span style={{ color: PALETTE.blush }}>Suite</span>
        </div>
        <div className="font-hand mt-1 text-xl" style={{ color: PALETTE.ink, opacity: 0.7 }}>
          a cozy world for your group
        </div>

        <div className="mt-5 flex rounded-full p-1" style={{ background: "rgba(255,255,255,0.5)", border: `2px solid ${PALETTE.ink}` }}>
          {(["sign-in", "create-account"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className="font-display flex-1 rounded-full py-2 text-sm"
              style={{
                background: mode === tab ? "#fff" : "transparent",
                color: PALETTE.ink,
                boxShadow: mode === tab ? `0 2px 0 ${PALETTE.ink}` : "none",
              }}
            >
              {tab === "sign-in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 text-left">
          <label className="block">
            <div
              className="font-display mb-1 text-[11px] tracking-wider"
              style={{ color: PALETTE.ink, opacity: 0.65 }}
            >
              EMAIL
            </div>
            <div
              className="flex items-center gap-2 rounded-full bg-white px-3 py-2"
              style={{
                border: `2.5px solid ${PALETTE.ink}`,
                boxShadow: `0 3px 0 ${PALETTE.ink}`,
              }}
            >
              <Mail size={18} style={{ color: PALETTE.ink, opacity: 0.6 }} />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-body flex-1 bg-transparent text-base outline-none"
                style={{ color: PALETTE.ink }}
              />
            </div>
          </label>

          <label className="block">
            <div
              className="font-display mb-1 text-[11px] tracking-wider"
              style={{ color: PALETTE.ink, opacity: 0.65 }}
            >
              PASSWORD
            </div>
            <div
              className="flex items-center gap-2 rounded-full bg-white px-3 py-2"
              style={{
                border: `2.5px solid ${PALETTE.ink}`,
                boxShadow: `0 3px 0 ${PALETTE.ink}`,
              }}
            >
              <Lock size={18} style={{ color: PALETTE.ink, opacity: 0.6 }} />
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="font-body flex-1 bg-transparent text-base outline-none"
                style={{ color: PALETTE.ink }}
              />
            </div>
          </label>

          {mode === "create-account" && (
            <label className="block">
              <div className="font-display mb-1 text-[11px] tracking-wider" style={{ color: PALETTE.ink, opacity: 0.65 }}>
                DISPLAY NAME
              </div>
              <div
                className="flex items-center gap-2 rounded-full bg-white px-3 py-2"
                style={{ border: `2.5px solid ${PALETTE.ink}`, boxShadow: `0 3px 0 ${PALETTE.ink}` }}
              >
                <UserPlus size={18} style={{ color: PALETTE.ink, opacity: 0.6 }} />
                <input
                  type="text"
                  required
                  autoComplete="nickname"
                  placeholder="Jess"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="font-body flex-1 bg-transparent text-base outline-none"
                  style={{ color: PALETTE.ink }}
                />
              </div>
            </label>
          )}

          <ChunkyButton type="submit" color="blush" full disabled={busy}>
            {busy ? (mode === "sign-in" ? "Signing in…" : "Creating…") : mode === "sign-in" ? "Sign in" : "Create account"}
          </ChunkyButton>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <p className="font-hand mt-1 text-center text-base" style={{ color: PALETTE.ink, opacity: 0.5 }}>
            {mode === "sign-in" ? "use your existing account to sign in" : "confirm your email, then you're in"}
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
