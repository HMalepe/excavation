import { ImageResponse } from "next/og";

export const runtime = "edge";
const SIZES = new Set([180, 192, 512]);

/** App icons for "add to home screen" (PNG, because installers don't take SVG). The three-layer mark. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const n = Number((await params).size);
  if (!SIZES.has(n)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ width: n, height: n, display: "flex", background: "#0a101c", alignItems: "center", justifyContent: "center" }}>
        <svg width={n * 0.78} height={n * 0.78} viewBox="0 0 32 32">
          <rect width="32" height="32" rx="9" fill="#1b57e5" />
          <rect x="7" y="8.5" width="18" height="3.6" rx="1.8" fill="#fff" />
          <rect x="9.5" y="14.2" width="13" height="3.6" rx="1.8" fill="#dbe6fc" />
          <rect x="12" y="19.9" width="8" height="3.6" rx="1.8" fill="#37e0c5" />
        </svg>
      </div>
    ),
    { width: n, height: n },
  );
}
