import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="relative mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden">
      <SkyBackground showGrass />
      <Header
        userId={user.id}
        userEmail={user.email ?? null}
        displayName={profile?.display_name ?? ""}
      />
      <main className="kz-hscroll relative z-10 min-h-0 flex-1 overflow-y-auto pb-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
