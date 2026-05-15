/* eslint-disable @next/next/no-img-element */
import { PALETTE, PET_TYPES } from "@/lib/utils";

type Props = {
  art?: number;
  size?: number;
  rounded?: number;
  halo?: boolean;
  border?: boolean;
  imageUrl?: string | null;
};

export function PetPortrait({
  art = 0,
  size = 180,
  rounded = 24,
  halo = true,
  border = true,
  imageUrl,
}: Props) {
  const pt = PET_TYPES[art % PET_TYPES.length];
  const fontSize = Math.round(size * 0.55);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        background: imageUrl
          ? "#fff"
          : `radial-gradient(120% 100% at 30% 20%, ${pt.bColor} 0%, ${pt.aColor} 55%, ${pt.ear} 100%)`,
        boxShadow: halo
          ? "inset 0 0 0 4px rgba(255,255,255,0.55), inset 0 -8px 24px rgba(0,0,0,0.05)"
          : "none",
        border: border ? `2.5px solid ${PALETTE.ink}` : "none",
        boxSizing: "border-box",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <div style={{ position: "absolute", top: 10, right: 14, width: 6, height: 6, borderRadius: 99, background: "rgba(255,255,255,0.8)" }} />
          <div style={{ position: "absolute", top: 22, right: 26, width: 3, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.7)" }} />
          <div style={{ position: "absolute", bottom: 16, left: 14, width: 4, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.6)" }} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize,
              lineHeight: 1,
              filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))",
            }}
          >
            {pt.face}
          </div>
        </>
      )}
    </div>
  );
}
