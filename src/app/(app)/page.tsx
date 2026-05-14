import { createClient } from "@/lib/supabase/server";
import { TodayView } from "@/components/views/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase.from("daily_tasks").select("*").order("sort_order"),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <TodayView
      initialTasks={tasks ?? []}
      userId={session!.user.id}
      profiles={profiles ?? []}
    />
  );
}
