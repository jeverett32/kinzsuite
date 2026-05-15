import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getSession } from "@/lib/supabase/cached";
import { TodayView } from "@/components/views/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();

  // Only need ~90 days of log entries for streak math; cap to keep payload small.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().slice(0, 10);

  const [session, profiles, tasksRes, logRes] = await Promise.all([
    getSession(),
    getAllProfiles(),
    supabase.from("daily_tasks").select("*").order("sort_order"),
    supabase.from("daily_log").select("*").gte("log_date", cutoff),
  ]);
  const userId = session!.user.id;
  const tasks = tasksRes.data;
  const log = logRes.data;

  return (
    <TodayView
      initialTasks={tasks ?? []}
      initialLog={log ?? []}
      initialProfiles={profiles}
      userId={userId}
    />
  );
}
