import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const mode = searchParams.get("mode");
  const invite = searchParams.get("invite");
  const groupName = searchParams.get("groupName")?.trim();

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (mode === "create-account") {
        if (invite) {
          const { error: joinErr } = await supabase.rpc("join_group_by_code", { p_code: invite });
          if (joinErr) return NextResponse.redirect(`${origin}/login?error=group`);
        } else {
          const { data, error: createErr } = await supabase.rpc("create_group", {
            p_name: groupName || "My group",
          });
          if (createErr) return NextResponse.redirect(`${origin}/login?error=group`);
          const inviteCode = data?.[0]?.invite_code;
          return NextResponse.redirect(
            `${origin}/onboarding${inviteCode ? `?invite=${encodeURIComponent(inviteCode)}` : ""}`,
          );
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
