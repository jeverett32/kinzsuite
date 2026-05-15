import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/cached";
import { getActiveGroupContext, getCurrentProfile } from "@/lib/groups";
import { TodayView } from "@/components/views/TodayView";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = createClient();
  const [session, profile, groupContext] = await Promise.all([
    getSession(),
    getCurrentProfile(),
    getActiveGroupContext(),
  ]);

  // Only need ~90 days of log entries for streak math; cap to keep payload small.
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
  const cutoff = ninetyDaysAgo.toISOString().slice(0, 10);

  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  const members = groupContext?.members.length
    ? groupContext.members.map((member) => member.profile)
    : profile
      ? [profile]
      : [];
  const memberIds = members.map((member) => member.id);
  const tasksQuery = activeGroupId
    ? supabase.from("daily_tasks").select("*").eq("group_id", activeGroupId).order("sort_order")
    : supabase
        .from("daily_tasks")
        .select("*")
        .is("group_id", null)
        .eq("user_id", session!.user.id)
        .order("sort_order");
  const logQuery = memberIds.length
    ? supabase.from("daily_log").select("*").gte("log_date", cutoff).in("user_id", memberIds)
    : supabase.from("daily_log").select("*").gte("log_date", cutoff).eq("user_id", session!.user.id);

  const [tasksRes, logRes] = await Promise.all([tasksQuery, logQuery]);
  const userId = session!.user.id;
  const tasks = tasksRes.data;
  const log = logRes.data;

  return (
    <TodayView
      initialTasks={tasks ?? []}
      initialLog={log ?? []}
      members={members}
      userId={userId}
      activeGroupId={activeGroupId}
    />
  );
}
