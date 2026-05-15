"use client";

/* eslint-disable @next/next/no-img-element */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Plus, Send, Heart, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { Avatar } from "@/components/ui/Avatar";
import { useChatUnread } from "@/components/shell/ChatUnreadContext";
import { createClient } from "@/lib/supabase/client";
import { PALETTE, shade } from "@/lib/utils";
import { ChatPushNotificationsBar } from "@/components/chat/ChatPushNotificationsBar";
import { resizeImage } from "@/lib/image";
import type { Message, MessageReaction, Profile } from "@/lib/supabase/types";

type Props = {
  initialMessages: Message[];
  initialReactions: MessageReaction[];
  userId: string;
  activeGroupId: string | null;
  members: Profile[];
};

const PAGE_SIZE = 30;
const REACTION_EMOJI = ["❤️", "😂", "😮", "😢", "👍", "🔥", "💀"] as const;
const DEFAULT_REACTION = "❤️";
const EMPTY_REACTIONS: MessageReaction[] = [];
const PICKER_EST_W = 292;
const PICKER_EST_H = 48;

type PickerState = {
  messageId: string;
  anchor: DOMRect;
  isMe: boolean;
};

export function ChatView({ initialMessages, initialReactions, userId, activeGroupId, members }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { markChatRead } = useChatUnread();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reactions, setReactions] = useState<Map<string, MessageReaction[]>>(() => {
    const m = new Map<string, MessageReaction[]>();
    for (const r of initialReactions) {
      const list = m.get(r.message_id) ?? [];
      list.push(r);
      m.set(r.message_id, list);
    }
    return m;
  });
  const reactionsRef = useRef(reactions);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(initialMessages.length >= PAGE_SIZE);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerState | null>(null);
  const bubbleRefs = useRef<Map<string, HTMLElement>>(new Map());
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const registerBubbleRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) bubbleRefs.current.set(id, el);
    else bubbleRefs.current.delete(id);
  }, []);

  const openReactionPicker = useCallback(
    (messageId: string) => {
      const el = bubbleRefs.current.get(messageId);
      if (!el) return;
      const msg = messages.find((m) => m.id === messageId);
      window.getSelection()?.removeAllRanges();
      setPicker({
        messageId,
        anchor: el.getBoundingClientRect(),
        isMe: msg?.sender_id === userId,
      });
    },
    [messages, userId],
  );

  const profileById = useMemo(() => {
    const m = new Map<string, Profile>();
    members.forEach((p) => m.set(p.id, p));
    return m;
  }, [members]);

  useEffect(() => {
    void markChatRead();
  }, [markChatRead]);

  useEffect(() => {
    reactionsRef.current = reactions;
  }, [reactions]);

  useEffect(() => {
    const filter = activeGroupId ? `group_id=eq.${activeGroupId}` : "group_id=is.null";
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter },
        (payload) => {
          const next = payload.new as Message;
          setMessages((cur) => {
            if (cur.some((m) => m.id === next.id)) return cur;
            return [...cur, next];
          });
          if (next.sender_id !== userId) void markChatRead();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        (payload) => {
          setReactions((cur) => {
            const next = new Map(cur);
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<MessageReaction>;
              if (!old.message_id || !old.user_id) return cur;
              const list = (next.get(old.message_id) ?? []).filter(
                (r) => r.user_id !== old.user_id,
              );
              if (list.length) next.set(old.message_id, list);
              else next.delete(old.message_id);
              return next;
            }
            const row = payload.new as MessageReaction;
            const list = (next.get(row.message_id) ?? []).filter(
              (r) => r.user_id !== row.user_id,
            );
            list.push(row);
            next.set(row.message_id, list);
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, markChatRead, activeGroupId]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const base = reactionsRef.current;
      const list = base.get(messageId) ?? [];
      const mine = list.find((r) => r.user_id === userId);
      const optimistic = new Map(base);
      const others = list.filter((r) => r.user_id !== userId);
      if (mine && mine.emoji === emoji) {
        if (others.length) optimistic.set(messageId, others);
        else optimistic.delete(messageId);
        reactionsRef.current = optimistic;
        setReactions(optimistic);
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId);
      } else {
        optimistic.set(messageId, [
          ...others,
          { message_id: messageId, user_id: userId, emoji, created_at: new Date().toISOString() },
        ]);
        reactionsRef.current = optimistic;
        setReactions(optimistic);
        await supabase
          .from("message_reactions")
          .upsert({ message_id: messageId, user_id: userId, emoji });
      }
    },
    [supabase, userId],
  );

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].created_at;
    const messagesQuery = activeGroupId
      ? supabase
          .from("messages")
          .select("*")
          .eq("group_id", activeGroupId)
          .lt("created_at", oldest)
      : supabase
          .from("messages")
          .select("*")
          .is("group_id", null)
          .lt("created_at", oldest);
    const { data } = await messagesQuery
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = (data ?? []).slice().reverse();
    setMessages((cur) => [...older, ...cur]);
    if (older.length) {
      const ids = older.map((m) => m.id);
      const { data: rx } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", ids);
      if (rx?.length) {
        setReactions((cur) => {
          const next = new Map(cur);
          for (const r of rx) {
            const list = (next.get(r.message_id) ?? []).filter(
              (x) => x.user_id !== r.user_id,
            );
            list.push(r);
            next.set(r.message_id, list);
          }
          return next;
        });
      }
    }
    if ((data?.length ?? 0) < PAGE_SIZE) setHasMore(false);
    setLoadingOlder(false);
  }, [supabase, messages, loadingOlder, hasMore, activeGroupId]);

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
        .insert({ sender_id: userId, group_id: activeGroupId, content: text });
      setSending(false);
      return !error;
    },
    [supabase, userId, sending, activeGroupId],
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
        .insert({ sender_id: userId, group_id: activeGroupId, image_url: data.publicUrl });
      setSending(false);
    },
    [supabase, userId, activeGroupId],
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
              emoji={members[0]?.avatar_emoji ?? "🙂"}
              color={members[0]?.accent_color ?? "blush"}
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
            {members.length > 1 ? "GROUP CHAT" : "CHAT"}
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
              <div
                key={m.id}
                className="kz-chat-row flex w-full"
                style={{ justifyContent: m.sender_id === userId ? "flex-end" : "flex-start" }}
              >
                <ChatBubble
                  msg={m}
                  prev={messages[i - 1]}
                  isMe={m.sender_id === userId}
                  senderName={m.sender_id === userId ? "You" : sender?.display_name || "Member"}
                  senderTone={sender?.accent_color ?? "sky"}
                  onImageClick={setLightboxUrl}
                  reactions={reactions.get(m.id) ?? EMPTY_REACTIONS}
                  myUserId={userId}
                  onReact={(id, emoji) => void toggleReaction(id, emoji)}
                  registerBubbleRef={registerBubbleRef}
                  onOpenPicker={openReactionPicker}
                />
              </div>
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
        groupLabel={members.length > 1 ? `${members.length} members` : "chat"}
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

      {picker && (
        <ReactionPickerOverlay
          anchor={picker.anchor}
          isMe={picker.isMe}
          onPick={(emoji) => {
            void toggleReaction(picker.messageId, emoji);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function ReactionPickerOverlay({
  anchor,
  isMe,
  onPick,
  onClose,
}: {
  anchor: DOMRect;
  isMe: boolean;
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(() => computePickerPos(anchor, isMe, PICKER_EST_W, PICKER_EST_H));

  useEffect(() => {
    window.getSelection()?.removeAllRanges();
    const prevOverflow = document.body.style.overflow;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.overflow = "hidden";
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.userSelect = prevUserSelect;
    };
  }, []);

  useEffect(() => {
    const el = pickerRef.current;
    if (!el) return;
    const w = el.offsetWidth || PICKER_EST_W;
    const h = el.offsetHeight || PICKER_EST_H;
    setPos(computePickerPos(anchor, isMe, w, h));
  }, [anchor, isMe]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{
          background: "rgba(0,0,0,0.4)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onPointerDown={(e) => e.preventDefault()}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={pickerRef}
        data-reaction-picker
        role="toolbar"
        aria-label="Pick reaction"
        className="fixed z-[61] flex select-none gap-0.5 rounded-full bg-white px-1.5 py-1"
        style={{
          top: pos.top,
          left: pos.left,
          border: `2.5px solid ${PALETTE.ink}`,
          boxShadow: `0 3px 0 ${PALETTE.ink}`,
          touchAction: "manipulation",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {REACTION_EMOJI.map((e) => (
          <div
            key={e}
            role="button"
            tabIndex={-1}
            aria-label={`React ${e}`}
            className="grid cursor-pointer place-items-center text-xl"
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
            }}
            onPointerDown={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
            }}
            onPointerUp={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onPick(e);
            }}
          >
            {e}
          </div>
        ))}
      </div>
    </>,
    document.body,
  );
}

function computePickerPos(anchor: DOMRect, isMe: boolean, width: number, height: number) {
  const gap = 8;
  const pad = 12;
  let top = anchor.bottom + gap;
  let left = isMe ? anchor.right - width : anchor.left;
  left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
  if (top + height > window.innerHeight - pad) {
    top = Math.max(pad, anchor.top - height - gap);
  }
  return { top, left };
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)" }}
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
    </div>,
    document.body,
  );
}

function ComposerImpl({
  groupLabel,
  sending,
  sendText,
  onPickFile,
}: {
  groupLabel: string;
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
          placeholder={`Message ${groupLabel}…`}
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
  reactions,
  myUserId,
  onReact,
  registerBubbleRef,
  onOpenPicker,
}: {
  msg: Message;
  prev?: Message;
  isMe: boolean;
  senderName: string;
  senderTone: import("@/lib/utils").PaletteColor;
  onImageClick: (url: string) => void;
  reactions: MessageReaction[];
  myUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  registerBubbleRef: (id: string, el: HTMLElement | null) => void;
  onOpenPicker: (messageId: string) => void;
}) {
  const lastTapRef = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const startLongPress = useCallback(() => {
    longPressFired.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onOpenPicker(msg.id);
    }, 450);
  }, [msg.id, onOpenPicker]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTap = useCallback(() => {
    if (longPressFired.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onReact(msg.id, DEFAULT_REACTION);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [msg.id, onReact]);

  const counts = useMemo(() => {
    const m = new Map<string, { count: number; mine: boolean }>();
    for (const r of reactions) {
      const cur = m.get(r.emoji) ?? { count: 0, mine: false };
      cur.count++;
      if (r.user_id === myUserId) cur.mine = true;
      m.set(r.emoji, cur);
    }
    return Array.from(m.entries());
  }, [reactions, myUserId]);

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

  const bubbleTouchStyle = {
    touchAction: "manipulation" as const,
    WebkitTouchCallout: "none" as const,
    userSelect: "none" as const,
  };

  return (
    <div
      data-chat-bubble={msg.id}
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
          ref={(el) => registerBubbleRef(msg.id, el)}
          type="button"
          onClick={() => {
            if (longPressFired.current) return;
            onImageClick(msg.image_url!);
          }}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="View photo full screen"
          className="block p-0"
          style={{ cursor: "pointer", background: "none", border: "none", ...bubbleTouchStyle }}
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
          ref={(el) => registerBubbleRef(msg.id, el)}
          onClick={handleTap}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(e) => e.preventDefault()}
          className="kz-bubble"
          style={{
            background: bubbleBg,
            color: text,
            borderRadius: radius,
            cursor: "pointer",
            ...bubbleTouchStyle,
          }}
        >
          {msg.content}
        </div>
      )}
      {counts.length > 0 && (
        <div
          className="flex flex-wrap gap-1"
          style={{ marginTop: 2, paddingLeft: isMe ? 0 : 6, paddingRight: isMe ? 6 : 0 }}
        >
          {counts.map(([emoji, info]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(msg.id, emoji)}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Toggle reaction ${emoji}`}
              className="font-display flex items-center gap-1 text-xs"
              style={{
                background: info.mine ? PALETTE.blush : "#fff",
                color: info.mine ? "#fff" : PALETTE.ink,
                border: `2px solid ${PALETTE.ink}`,
                boxShadow: `0 1.5px 0 ${PALETTE.ink}`,
                borderRadius: 99,
                padding: "1px 8px",
                cursor: "pointer",
                lineHeight: 1.2,
              }}
            >
              <span style={{ fontSize: 14 }}>{emoji}</span>
              {info.count > 1 && <span>{info.count}</span>}
            </button>
          ))}
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
    a.reactions === b.reactions &&
    a.myUserId === b.myUserId &&
    a.onReact === b.onReact &&
    a.registerBubbleRef === b.registerBubbleRef &&
    a.onImageClick === b.onImageClick
  );
});
