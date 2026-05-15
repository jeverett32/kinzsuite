import { cache } from "react";
import { getSession } from "@/lib/supabase/cached";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export type Group = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type GroupMemberProfile = {
  user_id: string;
  role: "owner" | "member";
  sort_order: number;
  joined_at: string;
  profile: Profile;
};

export type ActiveGroupContext = {
  profile: Profile;
  activeGroupId: string;
  group: Group;
  members: GroupMemberProfile[];
};

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const session = await getSession();
  if (!session) return null;

  const supabase = createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
  if (error) throw error;
  return data ?? null;
});

export const getActiveGroupContext = cache(async (): Promise<ActiveGroupContext | null> => {
  const profile = await getCurrentProfile();
  const activeGroupId = profile?.active_group_id ?? null;
  if (!profile || !activeGroupId) return null;

  const supabase = createClient();
  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .select("*")
    .eq("id", activeGroupId)
    .maybeSingle();
  if (groupErr) throw groupErr;

  const { data: memberRows, error: memberErr } = await supabase.rpc("get_group_members", {
    gid: activeGroupId,
  });
  if (memberErr) throw memberErr;

  const memberIds = (memberRows ?? []).map((row) => row.user_id);
  if (memberIds.length === 0) {
    return { profile, activeGroupId, group: group as Group, members: [] };
  }

  const { data: memberProfiles, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .in("id", memberIds);
  if (profileErr) throw profileErr;

  const profileById = new Map((memberProfiles ?? []).map((row) => [row.id, row]));

  return {
    profile,
    activeGroupId,
    group: group as Group,
    members: (memberRows ?? [])
      .map((row) => {
        const memberProfile = profileById.get(row.user_id);
        if (!memberProfile) return null;
        return { ...row, profile: memberProfile } as GroupMemberProfile;
      })
      .filter((row): row is GroupMemberProfile => row !== null),
  };
});

export const getUserGroups = cache(async (): Promise<Group[]> => {
  const session = await getSession();
  if (!session) return [];

  const supabase = createClient();
  const { data: memberships, error: membershipErr } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", session.user.id)
    .order("sort_order", { ascending: true });
  if (membershipErr) throw membershipErr;

  const groupIds = [...new Set((memberships ?? []).map((row) => row.group_id))];
  if (groupIds.length === 0) return [];

  const { data: groups, error: groupErr } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds);
  if (groupErr) throw groupErr;

  return (groups ?? []).sort((a, b) => {
    const ai = groupIds.indexOf(a.id);
    const bi = groupIds.indexOf(b.id);
    return ai - bi;
  }) as Group[];
});
