/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "kinaiauto.com — Magyar kínai autó iránytű";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(180deg, #f7f6f2 0%, #efece4 100%)",
          color: "#15181a",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Tiny grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(20,24,28,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,24,28,.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
          }}
        />

        {/* Header logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 32,
            letterSpacing: "-0.01em",
            zIndex: 1,
          }}
        >
          <span style={{ fontWeight: 400 }}>kinaiauto</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "#1a8a7a",
              marginTop: 4,
            }}
          />
          <span style={{ color: "#8b9197", fontSize: 24 }}>.com</span>
        </div>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: 60,
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#4a5158",
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 1,
          }}
        >
          <span
            style={{
              width: 40,
              height: 2,
              background: "#1a8a7a",
              display: "block",
            }}
          />
          Független kínai autó-iránytű · Magyarország
        </div>

        {/* Headline */}
        <div
          style={{
            marginTop: 28,
            fontSize: 84,
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            maxWidth: 980,
            zIndex: 1,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <span>Találd meg az&nbsp;</span>
          <span
            style={{
              fontStyle: "italic",
              color: "#1f5e54",
            }}
          >
            elképzeléseidnek
          </span>
          <span>&nbsp;megfelelő kínai modellt.</span>
        </div>

        {/* Footer stats row */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 28,
            borderTop: "1px solid #e5e2da",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", gap: 60 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 56 }}>60+</div>
              <div
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  color: "#8b9197",
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                Modell
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 56 }}>15</div>
              <div
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  color: "#8b9197",
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                Márka
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 56 }}>HU</div>
              <div
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  color: "#8b9197",
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                Hivatalosan kapható
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#4a5158",
              display: "flex",
            }}
          >
            kinaiauto.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
