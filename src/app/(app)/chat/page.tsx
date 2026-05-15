import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, getSession } from "@/lib/supabase/cached";
import { ChatView } from "@/components/views/ChatView";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = createClient();
  const [session, profiles, messagesRes] = await Promise.all([
    getSession(),
    getAllProfiles(),
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const initialMessages = (messagesRes.data ?? []).slice().reverse();
  const ids = initialMessages.map((m) => m.id);
  const { data: reactions } = ids.length
    ? await supabase.from("message_reactions").select("*").in("message_id", ids)
    : { data: [] as never[] };

  return (
    <ChatView
      initialMessages={initialMessages}
      initialReactions={reactions ?? []}
      userId={session!.user.id}
      profiles={profiles}
    />
  );
}
