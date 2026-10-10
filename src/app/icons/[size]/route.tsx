import { ImageResponse } from "next/og";

export const runtime = "edge";
const SIZES = new Set([180, 192, 512]);

/** App icons for "add to home screen" (PNG, because installers don't take SVG). The core-sample mark. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Number((await params).size);
  if (!SIZES.has(n)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", background: "#0a0d12", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: n * 0.78, height: n * 0.78, display: "flex", borderRadius: n * 0.2, overflow: "hidden", border: `${Math.max(2, n * 0.025)}px solid #f3f5f8` }}>
          <svg width={n * 0.78} height={n * 0.78} viewBox="0 0 32 32">
            <rect width="32" height="32" fill="#c7e5ff" />
            <path d="M0 10C8 7 14 12 22 9.5S30 8.5 32 9.5V32H0Z" fill="#4aa3ff" />
            <path d="M0 16.5C7 14.5 15 18.5 22 16S30 15.5 32 16.5V32H0Z" fill="#2b5fe8" />
            <path d="M0 22.5C9 20.5 15 24.5 23 22S30 21.5 32 22.5V32H0Z" fill="#0a1030" />
            <path d="M16 23.6l2.7 2.7-2.7 2.7-2.7-2.7z" fill="#ffd60a" />
          </svg>
        </div>
      </div>
    ),
    { width: n, height: n },
  );
}
