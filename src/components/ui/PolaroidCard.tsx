"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { PALETTE } from "@/lib/utils";
import { PetPortrait } from "./PetPortrait";
import type { Pet } from "@/lib/supabase/types";

function petCardBackground(gender: string | null) {
  if (gender === "boy") return "#C5E4FF";
  if (gender === "girl") return "#FFD6E8";
  return "#ffffff";
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
  const [wiggling, setWiggling] = useState(false);
  const birthdayLabel = pet.birthday
    ? format(new Date(pet.birthday), "MMM dd, yyyy")
    : "No birthday";

  const handleClick = useCallback(() => {
    setWiggling((playing) => {
      if (playing) {
        requestAnimationFrame(() => setWiggling(true));
        return false;
      }
      return true;
    });
    onClick?.();
  }, [onClick]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      onAnimationEnd={() => setWiggling(false)}
      className={
        "kz-sticker kz-polaroid-card " +
        (active ? "kz-polaroid-active" : "kz-polaroid-rest") +
        (wiggling ? " kz-wiggle-run" : "")
      }
      style={{
        width: 280,
        padding: 14,
        paddingBottom: 18,
        borderRadius: 32,
        textAlign: "left",
        cursor: "pointer",
        flexShrink: 0,
        background: petCardBackground(pet.gender),
        transition: wiggling ? undefined : "transform .25s cubic-bezier(.34,1.56,.64,1)",
      }}
    >
      <PetPortrait
        art={pet.art_index}
        size={252}
        rounded={22}
        imageUrl={pet.image_url}
      />
      <div className="mt-3 flex flex-col gap-1" style={{ color: PALETTE.ink }}>
        <div
          className="font-display truncate"
          style={{ fontSize: 30, letterSpacing: -0.2, lineHeight: 1.1, minHeight: 33 }}
        >
          {pet.name}
        </div>
        <div
          className="truncate text-sm font-semibold opacity-70"
          style={{ lineHeight: 1.25, minHeight: 18 }}
        >
          {pet.species || "—"}
        </div>
        <div
          className="truncate text-sm font-semibold opacity-70"
          style={{ lineHeight: 1.25, minHeight: 18 }}
        >
          {birthdayLabel}
        </div>
      </div>
    </div>
  );
}
