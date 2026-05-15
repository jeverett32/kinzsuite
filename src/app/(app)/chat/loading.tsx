import { PALETTE } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="flex h-full flex-col px-3.5 pt-2">
      <div className="mb-2 flex items-center gap-2.5">
        <div
          className="h-12 w-12 animate-pulse rounded-full"
          style={{ background: "rgba(255,255,255,0.7)", border: `2.5px solid ${PALETTE.ink}33` }}
        />
        <div className="h-5 w-28 animate-pulse rounded-full" style={{ background: "rgba(255,255,255,0.6)" }} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col-reverse gap-1.5 pb-2 pt-1.5">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-2xl"
              style={{
                width: `${50 + (i % 3) * 15}%`,
                alignSelf: i % 2 ? "flex-end" : "flex-start",
                background: i % 2 ? `${PALETTE.blush}55` : "rgba(255,255,255,0.75)",
                border: `2px solid ${PALETTE.ink}33`,
              }}
            />
          ))}
        </div>
      </div>
      <div
        className="mb-3 h-12 animate-pulse rounded-full"
        style={{ background: "rgba(255,255,255,0.75)", border: `2.5px solid ${PALETTE.ink}33` }}
      />
    </div>
  );
}
