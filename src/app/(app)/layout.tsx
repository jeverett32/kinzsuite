import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/cached";
import { getCurrentProfile, getActiveGroupContext } from "@/lib/groups";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { ChatUnreadProvider } from "@/components/shell/ChatUnreadContext";
import { SWRegister } from "@/components/shell/SWRegister";
import { SkyBackground } from "@/components/ui/SkyBackground";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // Middleware already validates the session; use getSession() here for a
  // local cookie read (no network) instead of getUser() (Auth round-trip).
  const session = await getSession();
  const user = session?.user;

  if (!user) redirect("/login");

  const [profile, groupContext] = await Promise.all([getCurrentProfile(), getActiveGroupContext()]);
  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  const [latestMsgRes, lastReadRes] = await Promise.all([
    activeGroupId
      ? supabase
          .from("messages")
          .select("created_at")
          .eq("group_id", activeGroupId)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : supabase
          .from("messages")
          .select("created_at")
          .is("group_id", null)
          .neq("sender_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
    activeGroupId
      ? supabase
          .from("chat_last_read")
          .select("last_read_at")
          .eq("user_id", user.id)
          .eq("group_id", activeGroupId)
          .order("last_read_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : supabase
          .from("chat_last_read")
          .select("last_read_at")
          .eq("user_id", user.id)
          .is("group_id", null)
          .order("last_read_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
  ]);

  const initialHasUnread = Boolean(
    latestMsgRes.data &&
      (!lastReadRes.data?.last_read_at ||
        new Date(latestMsgRes.data.created_at) > new Date(lastReadRes.data.last_read_at)),
  );

  return (
    <>
      <SWRegister />
      <div className="pointer-events-none fixed inset-0 z-0">
        <SkyBackground showGrass />
      </div>
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
        <ChatUnreadProvider
          userId={user.id}
          activeGroupId={activeGroupId}
          initialHasUnread={initialHasUnread}
        >
          <Header
            userId={user.id}
            userEmail={user.email ?? null}
            displayName={profile?.display_name ?? ""}
            avatarEmoji={profile?.avatar_emoji ?? "🙂"}
            accentColor={profile?.accent_color ?? "sky"}
          />
          <main className="relative z-10 min-h-0 flex-1">
            {children}
          </main>
          <BottomNav />
        </ChatUnreadProvider>
      </div>
    </>
  );
}
