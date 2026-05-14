import { createClient } from "@/lib/supabase/server";
import { ChatView } from "@/components/views/ChatView";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: messages }, { data: profiles }] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: true }).limit(200),
    supabase.from("profiles").select("*"),
  ]);

  return (
    <ChatView
      initialMessages={messages ?? []}
      userId={user!.id}
      profiles={profiles ?? []}
    />
  );
}
