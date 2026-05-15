import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const mode = searchParams.get("mode");
  const invite = searchParams.get("invite");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (mode === "create-account" && invite) {
        const { error: joinErr } = await supabase.rpc("join_group_by_code", { p_code: invite });
        if (joinErr) return NextResponse.redirect(`${origin}/login?error=group`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
