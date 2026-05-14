import { createClient } from "@/lib/supabase/server";
import { PetsView } from "@/components/views/PetsView";

export const dynamic = "force-dynamic";

export default async function PetsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: pets }, { data: profiles }] = await Promise.all([
    supabase.from("pets").select("*").order("created_at"),
    supabase.from("profiles").select("*"),
  ]);

  const me = profiles?.find((p) => p.id === user!.id) ?? null;
  const partner = profiles?.find((p) => p.id !== user!.id) ?? null;

  return (
    <PetsView
      initialPets={pets ?? []}
      userId={user!.id}
      me={me}
      partner={partner}
    />
  );
}
