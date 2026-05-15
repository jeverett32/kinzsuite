import { PALETTE } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="h-full px-4 pt-2">
      <div className="mb-3 h-10 w-48 animate-pulse rounded-lg" style={{ background: "rgba(255,255,255,0.55)" }} />
      <div
        className="mb-4 h-10 w-full animate-pulse rounded-full"
        style={{ background: "rgba(255,255,255,0.6)" }}
      />
      <div className="flex gap-4 overflow-hidden">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-[380px] w-[280px] flex-shrink-0 animate-pulse rounded-3xl"
            style={{ background: "rgba(255,255,255,0.7)", border: `2.5px solid ${PALETTE.ink}33` }}
          />
        ))}
      </div>
    </div>
  );
}
