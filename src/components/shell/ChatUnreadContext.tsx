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
  initialHasUnread,
  children,
}: {
  userId: string;
  initialHasUnread: boolean;
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const [hasUnreadChat, setHasUnreadChat] = useState(initialHasUnread);

  const markChatRead = useCallback(async () => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ chat_last_read_at: now })
      .eq("id", userId);
    if (!error) setHasUnreadChat(false);
  }, [supabase, userId]);

  useEffect(() => {
    const channel = supabase
      .channel("chat-unread-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
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
  }, [supabase, userId, pathname]);

  const value = useMemo(
    () => ({ hasUnreadChat, markChatRead }),
    [hasUnreadChat, markChatRead],
  );

  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}
