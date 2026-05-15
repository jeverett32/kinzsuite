"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/supabase/types";

type Ctx = {
  hasUnreadChat: boolean;
  markChatRead: () => Promise<void>;
};

const ChatUnreadContext = createContext<Ctx | null>(null);

export function useChatUnread() {
  const v = useContext(ChatUnreadContext);
  if (!v) throw new Error("useChatUnread must be used within ChatUnreadProvider");
  return v;
}

export function ChatUnreadProvider({
  userId,
  activeGroupId,
  initialHasUnread,
  children,
}: {
  userId: string;
  activeGroupId: string | null;
  initialHasUnread: boolean;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const [hasUnreadChat, setHasUnreadChat] = useState(initialHasUnread);

  const markChatRead = useCallback(async () => {
    const now = new Date().toISOString();
    const deleteQuery = supabase
      .from("chat_last_read")
      .delete()
      .eq("user_id", userId);
    const { error: deleteError } = activeGroupId
      ? await deleteQuery.eq("group_id", activeGroupId)
      : await deleteQuery.is("group_id", null);
    if (deleteError) return;
    const { error } = await supabase.from("chat_last_read").insert({
      user_id: userId,
      group_id: activeGroupId,
      last_read_at: now,
    });
    if (!error) setHasUnreadChat(false);
  }, [supabase, userId, activeGroupId]);

  useEffect(() => {
    setHasUnreadChat(initialHasUnread);
  }, [activeGroupId, initialHasUnread]);

  useEffect(() => {
    const filter = activeGroupId ? `group_id=eq.${activeGroupId}` : "group_id=is.null";
    const channel = supabase
      .channel("chat-unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter },
        (payload) => {
          const row = payload.new as Message;
          if (row.sender_id === userId) return;
          if (pathname === "/chat") return;
          setHasUnreadChat(true);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, pathname, activeGroupId]);

  const value = useMemo(
    () => ({ hasUnreadChat, markChatRead }),
    [hasUnreadChat, markChatRead],
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}
