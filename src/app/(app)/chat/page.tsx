import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/cached";
import { getActiveGroupContext, getCurrentProfile } from "@/lib/groups";
import { ChatView } from "@/components/views/ChatView";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = createClient();
  const [session, profile, groupContext] = await Promise.all([
    getSession(),
    getCurrentProfile(),
    getActiveGroupContext(),
  ]);
  const activeGroupId = groupContext?.activeGroupId ?? profile?.active_group_id ?? null;
  if (!activeGroupId) redirect("/");

  const members = groupContext?.members.length
    ? groupContext.members.map((member) => member.profile)
    : profile
      ? [profile]
      : [];
  const messagesQuery = supabase
    .from("messages")
    .select("*")
    .eq("group_id", activeGroupId)
    .order("created_at", { ascending: false })
    .limit(30);
  const { data: messages } = await messagesQuery;
  const initialMessages = (messages ?? []).slice().reverse();
  const ids = initialMessages.map((m) => m.id);
  const { data: reactions } = ids.length
    ? await supabase.from("message_reactions").select("*").in("message_id", ids)
    : { data: [] as never[] };

  return (
    <ChatView
      initialMessages={initialMessages}
      initialReactions={reactions ?? []}
      userId={session!.user.id}
      activeGroupId={activeGroupId}
      members={members}
    />
  );
}
