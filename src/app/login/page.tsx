"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { SkyBackground } from "@/components/ui/SkyBackground";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { PALETTE } from "@/lib/utils";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setSigningIn(false);
      // Don't leak whether the email exists — this app is private and a
      // generic message keeps things tidy.
      setError("That didn't work. Check your email and password.");
      return;
    }

    // Hard-refresh the destination so server components pick up the new
    // session cookie immediately.
    router.replace(next);
    router.refresh();
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
          a cozy world for two
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

          <ChunkyButton type="submit" color="blush" full disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </ChunkyButton>

          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}

          <p
            className="font-hand mt-1 text-center text-base"
            style={{ color: PALETTE.ink, opacity: 0.5 }}
          >
            this app is just for two — ask the other half to add you
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
