import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  kind: z.enum(["boundary", "error", "rejection"]),
  message: z.string().max(400),
  stack: z.string().max(1800).optional(),
  digest: z.string().max(64).optional(),
  path: z.string().max(120),
  ua: z.string().max(160),
});

// Best-effort per-instance throttle so this open endpoint can't flood the logs.
const hits = new Map<string, { n: number; at: number }>();
const WINDOW_MS = 60_000, MAX_HITS = 20;

/** POST a browser error. Writes ONE structured log line (JSON, so nothing in it can forge another line). */
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0]!.trim();
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > WINDOW_MS) hits.set(ip, { n: 1, at: now });
  else if (++h.n > MAX_HITS) return new NextResponse(null, { status: 204 });
  if (hits.size > 500) for (const [k, v] of hits) if (now - v.at > WINDOW_MS) hits.delete(k);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  console.error("[client-error]", JSON.stringify(parsed.data));
  return new NextResponse(null, { status: 204 });
}
