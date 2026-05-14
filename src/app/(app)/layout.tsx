import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { ChatUnreadProvider } from "@/components/shell/ChatUnreadContext";
import { SkyBackground } from "@/components/ui/SkyBackground";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  // Middleware already validates the session; use getSession() here for a
  // local cookie read (no network) instead of getUser() (Auth round-trip).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) redirect("/login");

  const [{ data: profile }, { data: latestPartnerMsg }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_emoji, accent_color, chat_last_read_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("created_at")
      .neq("sender_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lastRead = profile?.chat_last_read_at;
  const initialHasUnread = Boolean(
    latestPartnerMsg &&
      (!lastRead || new Date(latestPartnerMsg.created_at) > new Date(lastRead)),
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <SkyBackground showGrass />
      </div>
      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
        <ChatUnreadProvider userId={user.id} initialHasUnread={initialHasUnread}>
          <Header
            userId={user.id}
            userEmail={user.email ?? null}
            displayName={profile?.display_name ?? ""}
            avatarEmoji={profile?.avatar_emoji ?? "🙂"}
            accentColor={profile?.accent_color ?? "sky"}
          />
          <main className="kz-hscroll relative z-10 min-h-0 flex-1 overflow-y-auto pb-4">
            {children}
          </main>
          <BottomNav />
        </ChatUnreadProvider>
      </div>
    </>
  );
}
