import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/cached";
import { getActiveGroupContext, getCurrentProfile } from "@/lib/groups";
import { PetsView } from "@/components/views/PetsView";

export const dynamic = "force-dynamic";

export default async function PetsPage() {
  const supabase = createClient();
  const [session, profile, groupContext] = await Promise.all([
    getSession(),
    getCurrentProfile(),
    getActiveGroupContext(),
  ]);
  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  const members = groupContext?.members.length
    ? groupContext.members.map((member) => member.profile)
    : profile
      ? [profile]
      : [];
  const memberIds = members.map((member) => member.id);
  const petsQuery = memberIds.length
    ? supabase.from("pets").select("*").in("owner_id", memberIds).order("created_at")
    : supabase.from("pets").select("*").eq("owner_id", session!.user.id).order("created_at");
  const { data: pets } = await petsQuery;
  const userId = session!.user.id;

  return (
    <PetsView
      initialPets={pets ?? []}
      userId={userId}
      members={members}
      activeGroupId={activeGroupId}
    />
  );
}
