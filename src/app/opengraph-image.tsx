import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Excavation: dig deeper than your marks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview shown when a link is shared on WhatsApp or by email. */
export default function OgImage() {
  const layers = ["#c7e5ff", "#4aa3ff", "#2b5fe8", "#1d2f8f", "#0a1030"];
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", background: "#eceff3", color: "#0d1117" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 70px", width: 700, gap: 22 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#2347c5", fontWeight: 700 }}>THE EXCAVATION · SCHOOL EDITION</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, lineHeight: 1.0, letterSpacing: -3 }}>Dig deeper than your marks.</div>
          <div style={{ display: "flex", fontSize: 30, color: "#4a5361" }}>Choose your subjects from who you are and what you can do.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 500, height: 630 }}>
          {layers.map((c, i) => (
            <div key={c} style={{ display: "flex", flex: 1, background: c, alignItems: "center", justifyContent: "center" }}>
              {i === 4 ? <div style={{ display: "flex", width: 64, height: 64, background: "#ffd60a", transform: "rotate(45deg)", border: "5px solid #0d1117" }} /> : null}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
