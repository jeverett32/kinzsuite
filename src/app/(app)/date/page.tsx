import { createClient } from "@/lib/supabase/server";
import { DateView } from "@/components/views/DateView";

export const dynamic = "force-dynamic";

export default async function DatePage() {
  const supabase = createClient();
  const [{ data: quests }, { data: pick }] = await Promise.all([
    supabase.from("wheel_quests").select("*").order("sort_order"),
    supabase.from("date_wheel_pick").select("accepted_quest_id").eq("id", 1).maybeSingle(),
  ]);
  return (
    <DateView
      initialWheelQuests={quests ?? []}
      initialAcceptedQuestId={pick?.accepted_quest_id ?? null}
    />
  );
}
