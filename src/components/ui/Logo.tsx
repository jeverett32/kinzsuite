import { PALETTE } from "@/lib/utils";

export function Logo({ size = 32 }: { size?: number }) {
  const ink = PALETTE.ink;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <span
        style={{
          position: "absolute",
          inset: `${size * 0.06}px ${size * 0.375}px ${size * 0.06}px 0`,
          borderRadius: 999,
          background: PALETTE.sky,
          border: `2px solid ${ink}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: `${size * 0.06}px 0 ${size * 0.06}px ${size * 0.375}px`,
          borderRadius: 999,
          background: PALETTE.blush,
          border: `2px solid ${ink}`,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: size * 0.375,
          left: size * 0.4375,
          width: size * 0.125,
          height: size * 0.125,
          borderRadius: 999,
          background: "#fff",
        }}
      />
    </div>
  );
}
