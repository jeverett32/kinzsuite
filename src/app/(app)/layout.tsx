import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shell/Header";
import { BottomNav } from "@/components/shell/BottomNav";
import { SkyBackground } from "@/components/ui/SkyBackground";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden">
      <SkyBackground showGrass />
      <Header />
      <main className="kz-hscroll relative z-10 flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
