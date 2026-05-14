"use client";

import { Cake } from "lucide-react";
import { format } from "date-fns";
import { PALETTE } from "@/lib/utils";
import { PetPortrait } from "./PetPortrait";
import type { Pet } from "@/lib/supabase/types";

function formatGender(gender: string | null) {
  if (!gender) return null;
  if (gender === "boy") return "Boy";
  if (gender === "girl") return "Girl";
  if (gender === "unknown") return "Unknown";
  return gender;
}

export function PolaroidCard({
  pet,
  active,
  onClick,
}: {
  pet: Pet;
  active?: boolean;
  onClick?: () => void;
}) {
  const gender = formatGender(pet.gender);

  return (
    <button
      onClick={onClick}
      className={"kz-jiggle kz-sticker" + (active ? " kz-jiggle-active" : "")}
      style={{
        width: 280,
        padding: 14,
        paddingBottom: 18,
        borderRadius: 32,
        textAlign: "left",
        cursor: "pointer",
        flexShrink: 0,
        transform: active ? "translateY(-4px) rotate(-1.2deg)" : "rotate(-0.6deg)",
        transition: "transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s",
      }}
    >
      <PetPortrait
        art={pet.art_index}
        size={252}
        rounded={22}
        imageUrl={pet.image_url}
      />
      <div className="mt-3">
        <div
          className="font-display"
          style={{ fontSize: 30, color: PALETTE.ink, letterSpacing: -0.2, lineHeight: 1 }}
        >
          {pet.name}
        </div>
        <div
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold opacity-70"
          style={{ color: PALETTE.ink }}
        >
          <Cake size={14} strokeWidth={2.4} />
          <span>
            {pet.birthday ? format(new Date(pet.birthday), "MMM dd, yyyy") : "no birthday"}
          </span>
          {pet.species && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-current" />
              <span>{pet.species}</span>
            </>
          )}
          {gender && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-current" />
              <span>{gender}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
