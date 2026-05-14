import { createClient } from "@/lib/supabase/server";
import { TodayView } from "@/components/views/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session!.user.id;

  // Only need ~90 days of log entries for streak math; cap to keep payload small.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().slice(0, 10);

  const [{ data: tasks }, { data: log }, { data: profiles }] = await Promise.all([
    supabase.from("daily_tasks").select("*").order("sort_order"),
    supabase.from("daily_log").select("*").gte("log_date", cutoff),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <TodayView
      initialTasks={tasks ?? []}
      initialLog={log ?? []}
      initialProfiles={profiles ?? []}
      userId={userId}
    />
  );
}
