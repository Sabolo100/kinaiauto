/* Generated favicon — small jade dot logo. */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f6f2",
          color: "#15181a",
          fontSize: 22,
          fontWeight: 400,
          fontFamily: "Georgia, 'Instrument Serif', serif",
          letterSpacing: "-0.04em",
        }}
      >
        k
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: 999,
            background: "#1a8a7a",
            marginTop: 8,
            marginLeft: 1,
            display: "block",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
