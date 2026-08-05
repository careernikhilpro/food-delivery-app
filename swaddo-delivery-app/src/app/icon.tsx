import { ImageResponse } from "next/og";

export const dynamic = 'force-static';
export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
            display: "flex",
            width: "100%",
            height: "100%",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #10B981 0%, #064E3B 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: 60, // Squircle shape
            width: 400,
            height: 400,
            boxShadow: "0 16px 64px rgba(0,0,0,0.3)",
            border: "2px solid rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ display: "flex", fontSize: 90, fontWeight: 900, color: "white", letterSpacing: -3, lineHeight: 1 }}>Swaddo</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#34D399", letterSpacing: 4, textTransform: 'uppercase' }}>Delivery</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#34D399", letterSpacing: 4, textTransform: 'uppercase' }}>Partner</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
