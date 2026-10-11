import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Excavation: choose your subjects from who you are";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The preview shown when a link is shared on WhatsApp or by email. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", background: "#f5f7fb", color: "#0e1a2b", alignItems: "center", padding: "0 80px", gap: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", width: 700, gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="56" height="56" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="9" fill="#1b57e5" />
              <rect x="7" y="8.5" width="18" height="3.6" rx="1.8" fill="#fff" />
              <rect x="9.5" y="14.2" width="13" height="3.6" rx="1.8" fill="#dbe6fc" />
              <rect x="12" y="19.9" width="8" height="3.6" rx="1.8" fill="#37e0c5" />
            </svg>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>The Excavation</div>
          </div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5 }}>Choose your subjects from who you are.</div>
          <div style={{ display: "flex", fontSize: 28, color: "#566276" }}>School Edition · Grade 9 and Grade 11</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
          {[["Surface", "#0f9b8a"], ["Wading in", "#0f9b8a"], ["Deep water", "#1b57e5"], ["The trench", "#cfd8e6"], ["The floor", "#cfd8e6"]].map(([n, c]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: 26, height: 26, borderRadius: 13, background: c }} />
              <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: c === "#cfd8e6" ? "#566276" : "#0e1a2b" }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
