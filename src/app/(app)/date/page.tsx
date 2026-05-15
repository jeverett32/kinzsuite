import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getActiveGroupContext } from "@/lib/groups";
import { DateView } from "@/components/views/DateView";

export const dynamic = "force-dynamic";

export default async function DatePage() {
  const supabase = createClient();
  const [profile, groupContext] = await Promise.all([getCurrentProfile(), getActiveGroupContext()]);
  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  const questsQuery = activeGroupId
    ? supabase.from("wheel_quests").select("*").eq("group_id", activeGroupId).order("sort_order")
    : supabase.from("wheel_quests").select("*").is("group_id", null).order("sort_order");
  const pickQuery = activeGroupId
    ? supabase
        .from("date_wheel_pick")
        .select("accepted_quest_id")
        .eq("group_id", activeGroupId)
        .maybeSingle()
    : supabase
        .from("date_wheel_pick")
        .select("accepted_quest_id")
        .is("group_id", null)
        .maybeSingle();
  const [{ data: quests }, { data: pick }] = await Promise.all([questsQuery, pickQuery]);
  return (
    <DateView
      initialWheelQuests={quests ?? []}
      initialAcceptedQuestId={pick?.accepted_quest_id ?? null}
      activeGroupId={activeGroupId}
    />
  );
}
