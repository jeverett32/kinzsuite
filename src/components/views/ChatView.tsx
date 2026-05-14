"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Plus, Send, Heart } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { useChatUnread } from "@/components/shell/ChatUnreadContext";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade } from "@/lib/utils";
import type { Message, Profile } from "@/lib/supabase/types";

type Props = {
  initialMessages: Message[];
  userId: string;
  profiles: Profile[];
};

export function ChatView({ initialMessages, userId, profiles }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { markChatRead } = useChatUnread();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const partner = profiles.find((p) => p.id !== userId);
  const partnerName = partner?.display_name || "Partner";

  useEffect(() => {
    void markChatRead();
  }, [markChatRead]);

  useEffect(() => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const next = payload.new as Message;
          setMessages((cur) => {
            if (cur.some((m) => m.id === next.id)) return cur;
            return [...cur, next];
          });
          if (next.sender_id !== userId) void markChatRead();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, markChatRead]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    const { error } = await supabase
      .from("messages")
      .insert({ sender_id: userId, content: text });
    setSending(false);
    if (error) {
      // Restore the text so the user can retry.
      setDraft(text);
    }
  }

  async function uploadImage(file: File) {
    setSending(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("chat-images")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      setSending(false);
      return;
    }
    const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
    await supabase
      .from("messages")
      .insert({ sender_id: userId, image_url: data.publicUrl });
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-2.5 px-3.5 pb-2.5 pt-1">
        <div className="relative flex flex-shrink-0">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 99,
              overflow: "hidden",
              border: `2.5px solid ${PALETTE.ink}`,
              boxShadow: `0 3px 0 ${PALETTE.ink}`,
            }}
          >
            <Avatar
              emoji={partner?.avatar_emoji ?? "🙂"}
              color={partner?.accent_color ?? "blush"}
              size={42}
              border={false}
              halo={false}
            />
          </div>
          <span
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: 99,
              background: PALETTE.grass,
              border: `2px solid ${PALETTE.ink}`,
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="font-display flex items-center gap-1.5 text-xl leading-none"
            style={{ color: PALETTE.ink }}
          >
            {partnerName.toUpperCase()}
            <Heart size={14} color={PALETTE.blush} fill={PALETTE.blush} />
          </div>
          <div
            className="mt-1 text-[11px] font-bold"
            style={{ color: PALETTE.grass }}
          >
            ● online · in Kinzville
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="kz-hscroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3.5 pb-2 pt-1.5"
      >
        {messages.map((m, i) => {
          const sender = profiles.find((p) => p.id === m.sender_id);
          return (
            <ChatBubble
              key={m.id}
              msg={m}
              prev={messages[i - 1]}
              isMe={m.sender_id === userId}
              senderName={m.sender_id === userId ? "You" : sender?.display_name || "Them"}
              senderTone={sender?.accent_color ?? "sky"}
            />
          );
        })}
        {messages.length === 0 && (
          <div className="font-hand mx-auto mt-10 text-center text-lg" style={{ color: PALETTE.ink, opacity: 0.5 }}>
            no messages yet — say hi!
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-3.5 pb-3 pt-1.5">
        <div
          className="flex items-center gap-1 rounded-full bg-white p-1"
          style={{
            border: `2.5px solid ${PALETTE.ink}`,
            boxShadow: `0 3px 0 ${PALETTE.ink}`,
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadImage(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Add photo"
            className="grid place-items-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 99,
              border: `2px solid ${PALETTE.ink}`,
              background: "#fff",
              color: PALETTE.ink,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Plus size={20} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Camera"
            className="grid place-items-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 99,
              background: "transparent",
              color: PALETTE.ink,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Camera size={18} strokeWidth={2.2} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={`Message ${partnerName}…`}
            className="font-body min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm font-medium outline-none"
            style={{ color: PALETTE.ink }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="grid place-items-center"
            style={{
              width: 42,
              height: 42,
              borderRadius: 99,
              background:
                draft.trim() && !sending
                  ? `linear-gradient(180deg, ${PALETTE.blush}, ${shade(PALETTE.blush, -15)})`
                  : "#fff",
              color: draft.trim() && !sending ? "#fff" : PALETTE.ink,
              border: `2px solid ${PALETTE.ink}`,
              cursor: draft.trim() && !sending ? "pointer" : "not-allowed",
              boxShadow: draft.trim() && !sending ? `0 3px 0 ${PALETTE.ink}` : "none",
              flexShrink: 0,
            }}
          >
            <Send size={16} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  msg,
  prev,
  isMe,
  senderName,
  senderTone,
}: {
  msg: Message;
  prev?: Message;
  isMe: boolean;
  senderName: string;
  senderTone: import("@/lib/utils").PaletteColor;
}) {
  const consecutive =
    prev &&
    prev.sender_id === msg.sender_id &&
    isSameDay(new Date(prev.created_at), new Date(msg.created_at));
  const tone = PALETTE[senderTone];
  const bubbleBg = isMe
    ? `linear-gradient(180deg, ${tone}, ${shade(tone, -10)})`
    : "#fff";
  const text = isMe ? "#fff" : PALETTE.ink;
  const radius = isMe
    ? `20px ${consecutive ? 8 : 20}px 8px 20px`
    : `${consecutive ? 8 : 20}px 20px 20px 8px`;

  return (
    <div
      className="flex max-w-[80%] flex-col gap-0.5"
      style={{ alignSelf: isMe ? "flex-end" : "flex-start", alignItems: isMe ? "flex-end" : "flex-start" }}
    >
      {!consecutive && (
        <div
          className="font-display px-2.5 text-[10px]"
          style={{ color: PALETTE.ink, opacity: 0.6, letterSpacing: 0.4 }}
        >
          {senderName.toUpperCase()} · {format(new Date(msg.created_at), "h:mma").toLowerCase()}
        </div>
      )}
      {msg.image_url ? (
        <img
          src={msg.image_url}
          alt=""
          className="max-w-[220px]"
          style={{
            borderRadius: 18,
            border: `3px solid ${PALETTE.ink}`,
            boxShadow: `0 3px 0 ${PALETTE.ink}`,
          }}
        />
      ) : (
        <div
          className="text-sm font-semibold"
          style={{
            background: bubbleBg,
            color: text,
            padding: "8px 13px",
            borderRadius: radius,
            border: `2px solid ${PALETTE.ink}`,
            boxShadow: `0 2px 0 ${PALETTE.ink}`,
            wordBreak: "break-word",
            lineHeight: 1.35,
          }}
        >
          {msg.content}
        </div>
      )}
    </div>
  );
}
