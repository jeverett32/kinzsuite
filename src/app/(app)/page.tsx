import { createClient } from "@/lib/supabase/server";
import { TodayView } from "@/components/views/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase.from("daily_tasks").select("*").order("sort_order"),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <TodayView
      initialTasks={tasks ?? []}
      userId={user!.id}
      profiles={profiles ?? []}
    />
  );
}
