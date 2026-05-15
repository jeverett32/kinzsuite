import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/supabase/cached";
import { CopyCodeButton } from "@/components/onboarding/CopyCodeButton";
import { PALETTE } from "@/lib/utils";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ invite?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const params = (await searchParams) ?? {};
  const invite = params.invite ?? null;
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, active_group_id")
    .eq("id", session.user.id)
    .maybeSingle();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div
        className="kz-sticker w-full max-w-sm rounded-[28px] p-6 text-center"
        style={{ ["--ink" as never]: PALETTE.ink }}
      >
        <h1 className="font-display text-3xl" style={{ color: PALETTE.ink }}>
          Your group is ready
        </h1>
        <p className="font-hand mt-2 text-lg" style={{ color: PALETTE.ink, opacity: 0.7 }}>
          {profile?.display_name || "You"} is in.
        </p>
        {invite && (
          <div className="mt-5 rounded-3xl bg-white px-4 py-3" style={{ border: `2.5px solid ${PALETTE.ink}`, boxShadow: `0 3px 0 ${PALETTE.ink}` }}>
            <div className="font-display text-xs tracking-wider" style={{ color: PALETTE.ink, opacity: 0.6 }}>
              INVITE CODE
            </div>
            <div className="font-display mt-1 text-2xl" style={{ color: PALETTE.ink }}>
              {invite}
            </div>
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/"
            className="kz-chunky font-display inline-flex w-full items-center justify-center rounded-full px-4 py-3"
            style={{ background: PALETTE.blush, color: "#fff", border: `2px solid ${PALETTE.ink}`, boxShadow: `0 3px 0 ${PALETTE.ink}` }}
          >
            Continue
          </Link>
          {invite && (
            <CopyCodeButton code={invite} />
          )}
        </div>
        <p className="font-hand mt-4 text-sm" style={{ color: PALETTE.ink, opacity: 0.55 }}>
          You can manage members later from your profile.
        </p>
      </div>
    </main>
  );
}
