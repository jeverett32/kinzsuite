import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";
import { ensureWebPushConfigured } from "@/lib/push/vapid";

type CookieSet = { name: string; value: string; options?: CookieOptions };

export async function POST() {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    ensureWebPushConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "VAPID not configured";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  const { data: subs, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }
  if (!subs?.length) {
    return NextResponse.json(
      {
        error:
          "No push subscription for this account on this browser. Open Chat and tap “Get alerts for new messages.”",
      },
      { status: 400 },
    );
  }

  const payload = JSON.stringify({
    title: "KinzSuite test",
    body: "Push is working. You can dismiss this.",
    url: "/administration",
  });

  let sent = 0;
  let lastErr = "";
  for (const row of subs) {
    const pushSub = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webpush.sendNotification(pushSub, payload, {
        TTL: 120,
        urgency: "normal",
      });
      sent += 1;
    } catch (err: unknown) {
      const statusCode =
        typeof err === "object" && err !== null && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", row.id);
      } else if (typeof err === "object" && err !== null && "message" in err) {
        lastErr = String((err as { message: unknown }).message);
      } else {
        lastErr = "Send failed";
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { error: lastErr || "Could not deliver to any subscription." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, sent, total: subs.length });
}
