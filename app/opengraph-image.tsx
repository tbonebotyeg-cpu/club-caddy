import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Club Caddy — know every yardage";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#b6ff00",
              color: "#0a0a0a",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 800,
            }}
          >
            CC
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>Club Caddy</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>
            Know every yardage.
          </div>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -3, color: "#b6ff00", lineHeight: 1.05 }}>
            Own every shot.
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#a1a1aa" }}>
          Your bag · Smart caddy · Scorecard · Handicap
        </div>
      </div>
    ),
    size,
  );
}
