"use client";

import { Avatar } from "@/components/ui/Avatar";
import { PALETTE } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

type Member = {
  profile: Profile;
  label: string;
};

type Props = {
  members: Member[];
  value: string | null;
  onChange: (userId: string) => void;
};

export function MemberPillStrip({ members, value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {members.map(({ profile, label }) => {
        const active = profile.id === value;
        return (
          <button
            key={profile.id}
            type="button"
            onClick={() => onChange(profile.id)}
            className="kz-chunky flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-left"
            style={{
              background: active ? "#fff" : "rgba(255,255,255,0.78)",
              color: PALETTE.ink,
              boxShadow: `0 2px 0 ${PALETTE.ink}`,
              border: `2px solid ${PALETTE.ink}`,
              opacity: active ? 1 : 0.88,
            }}
          >
            <Avatar emoji={profile.avatar_emoji} color={profile.accent_color} size={28} />
            <span className="font-display truncate text-sm tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
