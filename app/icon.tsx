import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#b6ff00",
          color: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: -2,
        }}
      >
        CC
      </div>
    ),
    size,
  );
}
