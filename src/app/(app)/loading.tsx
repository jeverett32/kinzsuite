import { PALETTE } from "@/lib/utils";

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center pb-20">
      <div
        className="font-display animate-pulse text-sm tracking-wider"
        style={{ color: PALETTE.ink, opacity: 0.6 }}
      >
        LOADING…
      </div>
    </div>
  );
}
