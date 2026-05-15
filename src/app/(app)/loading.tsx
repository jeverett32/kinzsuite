import { PALETTE } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="h-full px-4 pt-2">
      <div className="mb-3 h-6 w-40 animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
      <div className="mb-3 h-10 w-full animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.55)" }} />
      <div className="grid grid-cols-3 gap-2.5 pb-3.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[72px] animate-pulse rounded-[18px]"
            style={{ background: "rgba(255,255,255,0.6)", border: `2.5px solid ${PALETTE.ink}33` }}
          />
        ))}
      </div>
      <div
        className="h-64 animate-pulse rounded-3xl"
        style={{ background: "rgba(255,255,255,0.55)", border: `2.5px solid ${PALETTE.ink}33` }}
      />
    </div>
  );
}
