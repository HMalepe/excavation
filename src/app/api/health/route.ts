import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public liveness check for uptime monitors: no database call, no secrets, nothing about learners. */
export function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString(), version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev" }, { headers: { "cache-control": "no-store" } });
}
