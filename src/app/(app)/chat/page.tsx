import { createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/views/ChatView";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const [{ data: messages }, { data: profiles }] = await Promise.all([
    supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("profiles").select("*"),
  ]);
  const initialMessages = (messages ?? []).slice().reverse();

  return (
    <ChatView
      initialMessages={initialMessages}
      userId={session!.user.id}
      profiles={profiles ?? []}
    />
  );
}
