import { PALETTE } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="h-full px-4 pt-1">
      <div
        className="mb-3 w-full animate-pulse rounded-2xl"
        style={{
          aspectRatio: "5 / 4",
          background: "rgba(255,255,255,0.55)",
          border: `3px solid ${PALETTE.ink}33`,
        }}
      />
      <div
        className="h-40 animate-pulse rounded-[22px]"
        style={{ background: "rgba(255,255,255,0.65)", border: `2.5px solid ${PALETTE.ink}33` }}
      />
    </div>
  );
}
