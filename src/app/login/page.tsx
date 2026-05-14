"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Sparkles } from "lucide-react";
import { ChunkyButton } from "@/components/ui/ChunkyButton";
import { SkyBackground } from "@/components/ui/SkyBackground";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { PALETTE } from "@/lib/utils";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <SkyBackground showGrass />

      <div
        className="kz-sticker relative z-10 w-full max-w-sm rounded-[28px] p-6 text-center"
        style={{ ["--ink" as any]: PALETTE.ink }}
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

        {sent ? (
          <div className="mt-6 space-y-3 text-left">
            <div
              className="font-display flex items-center gap-2 text-base"
              style={{ color: PALETTE.ink }}
            >
              <Sparkles size={18} className="text-blush" />
              CHECK YOUR EMAIL
            </div>
            <p className="text-sm opacity-80" style={{ color: PALETTE.ink }}>
              We just sent a magic link to <strong>{email}</strong>. Click it on this
              device to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
            <label
              className="font-display text-left text-xs tracking-wide"
              style={{ color: PALETTE.ink, opacity: 0.65 }}
            >
              YOUR EMAIL
            </label>
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
            <ChunkyButton type="submit" color="blush" full disabled={sending}>
              {sending ? "Sending…" : "Send magic link"}
            </ChunkyButton>
            {error && (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            )}
          </form>
        )}
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
