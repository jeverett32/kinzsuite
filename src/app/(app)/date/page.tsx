import { createClient } from "@/lib/supabase/server";
import { DateView } from "@/components/views/DateView";

export const dynamic = "force-dynamic";

export default async function DatePage() {
  const supabase = createClient();
  const { data: quests } = await supabase.from("wheel_quests").select("*").order("sort_order");
  return <DateView initialWheelQuests={quests ?? []} />;
}
