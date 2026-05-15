"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Plus, Send, Heart, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { useChatUnread } from "@/components/shell/ChatUnreadContext";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade } from "@/lib/utils";
import { ChatPushNotificationsBar } from "@/components/chat/ChatPushNotificationsBar";
import { resizeImage } from "@/lib/image";
import type { Message, Profile } from "@/lib/supabase/types";

type Props = {
  initialMessages: Message[];
  userId: string;
  profiles: Profile[];
};

const PAGE_SIZE = 30;

export function ChatView({ initialMessages, userId, profiles }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { markChatRead } = useChatUnread();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= PAGE_SIZE);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const partner = useMemo(() => profiles.find((p) => p.id !== userId), [profiles, userId]);
  const partnerName = partner?.display_name || "Partner";

  const profileById = useMemo(() => {
    const m = new Map<string, Profile>();
    profiles.forEach((p) => m.set(p.id, p));
    return m;
  }, [profiles]);

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

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = (data ?? []).slice().reverse();
    setMessages((cur) => [...older, ...cur]);
    if ((data?.length ?? 0) < PAGE_SIZE) setHasMore(false);
    setLoadingOlder(false);
  }, [supabase, messages, loadingOlder, hasMore]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !hasMore) return;
    const onScroll = () => {
      // flex-col-reverse: oldest is at top (scrollTop near max negative).
      // Detect scrolled to top of historical content.
      const distFromTop = el.scrollHeight + el.scrollTop - el.clientHeight;
      if (distFromTop < 80) void loadOlder();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadOlder, hasMore]);

  const sendText = useCallback(
    async (text: string) => {
      if (!text || sending) return false;
      setSending(true);
      const { error } = await supabase
        .from("messages")
        .insert({ sender_id: userId, content: text });
      setSending(false);
      return !error;
    },
    [supabase, userId, sending],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      setSending(true);
      const blob = await resizeImage(file, 1280, 0.82);
      const isResized = blob !== file;
      const ext = isResized ? "jpg" : file.name.split(".").pop() || "jpg";
      const contentType = isResized ? "image/jpeg" : file.type;
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("chat-images")
        .upload(path, blob, { contentType });
      if (upErr) {
        setSending(false);
        return;
      }
      const { data } = supabase.storage.from("chat-images").getPublicUrl(path);
      await supabase
        .from("messages")
        .insert({ sender_id: userId, image_url: data.publicUrl });
      setSending(false);
    },
    [supabase, userId],
  );

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
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="font-display flex items-center gap-1.5 text-xl leading-none"
            style={{ color: PALETTE.ink }}
          >
            {partnerName.toUpperCase()}
            <Heart size={14} color={PALETTE.blush} fill={PALETTE.blush} />
          </div>
        </div>
      </div>

      <ChatPushNotificationsBar />

      <div
        ref={scrollerRef}
        className="kz-hscroll flex min-h-0 flex-1 flex-col-reverse gap-1.5 overflow-y-auto px-3.5 pb-2 pt-1.5"
      >
        <div className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const sender = profileById.get(m.sender_id);
            return (
              <ChatBubble
                key={m.id}
                msg={m}
                prev={messages[i - 1]}
                isMe={m.sender_id === userId}
                senderName={m.sender_id === userId ? "You" : sender?.display_name || "Them"}
                senderTone={sender?.accent_color ?? "sky"}
                onImageClick={setLightboxUrl}
              />
            );
          })}
          {loadingOlder && (
            <div className="font-hand py-2 text-center text-xs" style={{ color: PALETTE.ink, opacity: 0.5 }}>
              loading…
            </div>
          )}
        </div>
        {messages.length === 0 && (
          <div className="font-hand mx-auto mt-10 text-center text-lg" style={{ color: PALETTE.ink, opacity: 0.5 }}>
            no messages yet — say hi!
          </div>
        )}
      </div>

      <Composer
        partnerName={partnerName}
        sending={sending}
        sendText={sendText}
        onPickFile={() => fileRef.current?.click()}
      />

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

      {lightboxUrl && (
        <ChatImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}

function ChatImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute grid h-10 w-10 place-items-center rounded-full"
        style={{
          top: "max(1rem, env(safe-area-inset-top))",
          right: "max(1rem, env(safe-area-inset-right))",
          background: "#fff",
          border: `2px solid ${PALETTE.ink}`,
          boxShadow: `0 2px 0 ${PALETTE.ink}`,
          color: PALETTE.ink,
          zIndex: 1,
        }}
      >
        <X size={20} />
      </button>
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain"
        style={{ maxHeight: "calc(100dvh - 2rem)", maxWidth: "100%" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function ComposerImpl({
  partnerName,
  sending,
  sendText,
  onPickFile,
}: {
  partnerName: string;
  sending: boolean;
  sendText: (text: string) => Promise<boolean>;
  onPickFile: () => void;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmed = draft.trim();
  const canSend = !!trimmed && !sending;

  async function send(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!canSend) return;
    const text = trimmed;
    setDraft("");
    
    // Attempt to maintain focus immediately so keyboard stays up
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    const ok = await sendText(text);
    if (!ok) setDraft(text);
  }

  return (
    <div className="flex-shrink-0 px-3.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),14px)]">
      <form
        onSubmit={send}
        className="flex items-center gap-1 rounded-full bg-white p-1"
        style={{
          border: `2.5px solid ${PALETTE.ink}`,
          boxShadow: `0 3px 0 ${PALETTE.ink}`,
        }}
      >
        <button
          type="button"
          onClick={onPickFile}
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
          onClick={onPickFile}
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
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${partnerName}…`}
          className="font-body min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm font-medium outline-none"
          style={{ color: PALETTE.ink }}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send"
          className="grid place-items-center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 99,
            background: canSend
              ? `linear-gradient(180deg, ${PALETTE.blush}, ${shade(PALETTE.blush, -15)})`
              : "#fff",
            color: canSend ? "#fff" : PALETTE.ink,
            border: `2px solid ${PALETTE.ink}`,
            cursor: canSend ? "pointer" : "not-allowed",
            boxShadow: canSend ? `0 3px 0 ${PALETTE.ink}` : "none",
            flexShrink: 0,
          }}
        >
          <Send size={16} strokeWidth={2.6} />
        </button>
      </form>
    </div>
  );
}
const Composer = memo(ComposerImpl);

function ChatBubbleImpl({
  msg,
  prev,
  isMe,
  senderName,
  senderTone,
  onImageClick,
}: {
  msg: Message;
  prev?: Message;
  isMe: boolean;
  senderName: string;
  senderTone: import("@/lib/utils").PaletteColor;
  onImageClick: (url: string) => void;
}) {
  const consecutive =
    !!prev &&
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
        <button
          type="button"
          onClick={() => onImageClick(msg.image_url!)}
          aria-label="View photo full screen"
          className="block p-0"
          style={{ cursor: "pointer", background: "none", border: "none" }}
        >
          <img
            src={msg.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="max-w-[220px]"
            style={{
              display: "block",
              height: "auto",
              borderRadius: 18,
              border: `3px solid ${PALETTE.ink}`,
              boxShadow: `0 3px 0 ${PALETTE.ink}`,
            }}
          />
        </button>
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
const ChatBubble = memo(ChatBubbleImpl, (a, b) => {
  return (
    a.msg.id === b.msg.id &&
    a.msg.content === b.msg.content &&
    a.msg.image_url === b.msg.image_url &&
    a.prev?.id === b.prev?.id &&
    a.isMe === b.isMe &&
    a.senderName === b.senderName &&
    a.senderTone === b.senderTone &&
    a.onImageClick === b.onImageClick
  );
});
