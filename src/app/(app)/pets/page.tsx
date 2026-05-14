import { createClient } from "@/lib/supabase/server";
import { PetsView } from "@/components/views/PetsView";

export const dynamic = "force-dynamic";

export default async function PetsPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session!.user.id;

  const [{ data: pets }, { data: profiles }] = await Promise.all([
    supabase.from("pets").select("*").order("created_at"),
    supabase.from("profiles").select("*"),
  ]);

  const me = profiles?.find((p) => p.id === userId) ?? null;
  const partner = profiles?.find((p) => p.id !== userId) ?? null;

  return (
    <PetsView
      initialPets={pets ?? []}
      userId={userId}
      me={me}
      partner={partner}
    />
  );
}
