import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getSession } from "@/lib/supabase/cached";
import { PetsView } from "@/components/views/PetsView";

export const dynamic = "force-dynamic";

export default async function PetsPage() {
  const supabase = createClient();
  const [session, profiles, petsRes] = await Promise.all([
    getSession(),
    getAllProfiles(),
    supabase.from("pets").select("*").order("created_at"),
  ]);
  const userId = session!.user.id;
  const pets = petsRes.data;
  const me = profiles.find((p) => p.id === userId) ?? null;
  const partner = profiles.find((p) => p.id !== userId) ?? null;

  return (
    <PetsView
      initialPets={pets ?? []}
      userId={userId}
      me={me}
      partner={partner}
    />
  );
}
