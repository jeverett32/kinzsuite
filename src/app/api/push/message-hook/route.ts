import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureWebPushConfigured } from "@/lib/push/vapid";

function timingSafeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return ba.equals(bb);
}

function extractSecret(request: Request): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return request.headers.get("x-kinz-push-hook-secret");
}

type HookBody = {
  type?: string;
  table?: string;
  record?: {
    id: string;
    sender_id: string;
    group_id?: string | null;
    content?: string | null;
    image_url?: string | null;
  };
};

function buildNotificationBody(record: NonNullable<HookBody["record"]>): string {
  if (record.content?.trim()) {
    const t = record.content.trim();
    return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  }
  if (record.image_url) return "Sent a photo";
  return "New message";
}

export async function POST(request: Request) {
  const expected = process.env.PUSH_MESSAGE_HOOK_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "PUSH_MESSAGE_HOOK_SECRET not configured" }, { status: 503 });
  }

  const provided = extractSecret(request);
  if (!provided || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: HookBody;
  try {
    body = (await request.json()) as HookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = body.record;
  if (!record?.sender_id) {
    return NextResponse.json({ error: "Missing record" }, { status: 400 });
  }

  try {
    ensureWebPushConfigured();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "VAPID not configured";
    return NextResponse.json({ error: msg }, { status: 503 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });
  }

  const [{ data: senderProfile }, { data: recipients }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", record.sender_id).maybeSingle(),
    record.group_id
      ? admin.from("group_members").select("user_id").eq("group_id", record.group_id).neq("user_id", record.sender_id)
      : admin.from("profiles").select("id").neq("id", record.sender_id),
  ]);

  const recipientIds = (recipients ?? []).map((r) => {
    if (record.group_id && "user_id" in r) return r.user_id as string;
    return (r as { id: string }).id;
  });
  if (recipientIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", recipientIds);

  if (!subs?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const senderName = senderProfile?.display_name?.trim() || "Partner";
  const notificationBody = buildNotificationBody(record);
  const payload = JSON.stringify({
    title: senderName,
    body: notificationBody,
    url: "/chat",
  });

  let sent = 0;
  for (const row of subs) {
    const pushSub = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webpush.sendNotification(pushSub, payload, {
        TTL: 60 * 60 * 24,
        urgency: "high",
      });
      sent += 1;
    } catch (err: unknown) {
      const statusCode =
        typeof err === "object" && err !== null && "statusCode" in err
          ? (err as { statusCode?: number }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
