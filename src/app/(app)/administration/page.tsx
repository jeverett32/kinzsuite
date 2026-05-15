import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getActiveGroupContext, getUserGroups } from "@/lib/groups";
import { AdministrationView } from "@/components/views/AdministrationView";

export const dynamic = "force-dynamic";

export default async function AdministrationPage() {
  const supabase = createClient();
  const [profile, groupContext, initialGroups] = await Promise.all([
    getCurrentProfile(),
    getActiveGroupContext(),
    getUserGroups(),
  ]);
  const userId = profile?.id ?? (await supabase.auth.getSession()).data.session!.user.id;
  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  const tasksQuery = activeGroupId
    ? supabase.from("daily_tasks").select("*").eq("group_id", activeGroupId).order("sort_order")
    : supabase.from("daily_tasks").select("*").is("group_id", null).eq("user_id", userId).order("sort_order");
  const questsQuery = activeGroupId
    ? supabase.from("wheel_quests").select("*").eq("group_id", activeGroupId).order("sort_order")
    : supabase.from("wheel_quests").select("*").is("group_id", null).order("sort_order");
  const [{ data: tasks }, { data: quests }] = await Promise.all([tasksQuery, questsQuery]);

  return (
    <AdministrationView
      userId={userId}
      initialTasks={tasks ?? []}
      initialQuests={quests ?? []}
      initialGroups={initialGroups}
      activeGroupId={activeGroupId}
    />
  );
}
