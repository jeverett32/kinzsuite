import { createClient } from "@/lib/supabase/server";
import { AdministrationView } from "@/components/views/AdministrationView";

export const dynamic = "force-dynamic";

export default async function AdministrationPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session!.user.id;

  const [{ data: tasks }, { data: quests }] = await Promise.all([
    supabase.from("daily_tasks").select("*").order("sort_order"),
    supabase.from("wheel_quests").select("*").order("sort_order"),
  ]);

  return (
    <AdministrationView
      userId={userId}
      initialTasks={tasks ?? []}
      initialQuests={quests ?? []}
    />
  );
}
