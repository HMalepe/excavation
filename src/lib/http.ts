import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth/guards";

/** Wraps a route handler: typed errors become JSON responses; unexpected errors are logged, not leaked. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return NextResponse.json({ error: "Invalid request", issues: e.issues.map((i) => i.path.join(".")) }, { status: 400 });
      console.error("[route error]", e);
      return NextResponse.json({ error: "Something went wrong. Your progress is saved." }, { status: 500 });
    }
  };
}

export const ok = (body: unknown = { ok: true }) => NextResponse.json(body);
