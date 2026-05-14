import { PALETTE, shade } from "@/lib/utils";

function Cloud({ x, y, scale = 1, delay = 0 }: { x: string; y: string; scale?: number; delay?: number }) {
  return (
    <div
      className="kz-drift"
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
        animationDelay: `${delay}s`,
        filter: "drop-shadow(0 3px 0 rgba(19,41,75,0.18))",
      }}
    >
      <div style={{ position: "relative", width: 110, height: 50 }}>
        <span style={{ position: "absolute", left: 0,  top: 18, width: 38, height: 38, borderRadius: 999, background: "#fff" }} />
        <span style={{ position: "absolute", left: 24, top: 4,  width: 46, height: 46, borderRadius: 999, background: "#fff" }} />
        <span style={{ position: "absolute", left: 54, top: 12, width: 40, height: 40, borderRadius: 999, background: "#fff" }} />
        <span style={{ position: "absolute", left: 72, top: 22, width: 32, height: 32, borderRadius: 999, background: "#fff" }} />
      </div>
    </div>
  );
}

export function SkyBackground({ showGrass = false }: { showGrass?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${PALETTE.sky} 0%, ${shade(PALETTE.sky, 35)} 55%, ${shade(PALETTE.sky, 60)} 92%)`,
        }}
      />
      <div
        className="absolute"
        style={{
          top: "max(0px, env(safe-area-inset-top, 0px))",
          right: "max(0px, env(safe-area-inset-right, 0px))",
          width: 220,
          height: 220,
          borderRadius: 999,
          background: `radial-gradient(circle, ${PALETTE.sun}aa 0%, transparent 65%)`,
        }}
      />
      <div className="absolute inset-0 overflow-hidden">
        <Cloud x="6%" y="14%" scale={1} delay={0} />
        <Cloud x="62%" y="7%" scale={0.7} delay={-6} />
        <Cloud x="78%" y="22%" scale={0.5} delay={-12} />
        <Cloud x="-4%" y="34%" scale={0.85} delay={-3} />
        <Cloud x="48%" y="40%" scale={0.6} delay={-9} />
        {showGrass && (
          <div
            style={{
              position: "absolute",
              bottom: -30,
              left: -40,
              right: -40,
              height: 130,
              background: `linear-gradient(180deg, ${PALETTE.grass} 0%, ${shade(PALETTE.grass, -25)} 100%)`,
              borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
              borderTop: `3px solid ${PALETTE.ink}`,
              opacity: 0.6,
            }}
          />
        )}
      </div>
    </div>
  );
}
