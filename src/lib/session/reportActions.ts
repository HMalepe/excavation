import "server-only";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { HttpError } from "@/lib/auth/guards";
import { serverEnv } from "@/lib/env.server";
import { loadReportBundle } from "@/lib/report/load";
import { generateSummary } from "@/lib/pipeline/summaries";
import { assertStage } from "./service";
import type { Ctx } from "./actions";
import type { ReportG9, ReportG11 } from "@/lib/ai/schemas";

const def = <S extends z.ZodType>(body: S, run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown>) => ({ body, run });

export const reportActions = {
  /** Tick boxes on the Grade 11 plan (spec 08 Part 7). */
  plan_tick: def(z.object({ index: z.number().int().min(0).max(20), done: z.boolean() }), async ({ session }, b) => {
    assertStage(session, "report");
    const db = adminDb();
    const { data } = await db.from("reports").select("id, learner_state").eq("session_id", session.id).eq("kind", "learner").single();
    if (!data) throw new HttpError(404, "No report");
    const state = (data.learner_state ?? {}) as { plan?: Record<string, boolean> };
    await db.from("reports").update({ learner_state: { ...state, plan: { ...(state.plan ?? {}), [b.index]: b.done } } }).eq("id", data.id);
    return {};
  }),

  /**
   * Learner-controlled sharing (spec 09 §3.1): "Share a summary with my LO teacher" / "with my
   * parent/guardian". On: generate the summary from the REPORT (never the transcript) and grant.
   * Off: revoke. A parent gets a revocable link; only the token's hash is stored.
   */
  share: def(z.object({ audience: z.enum(["teacher", "parent"]), on: z.boolean() }), async ({ session, caller }, b) => {
    assertStage(session, "report");
    const db = adminDb();
    const bundle = await loadReportBundle(session.id);
    if (bundle.report?.status !== "released") throw new HttpError(409, "Your report isn't ready yet.");
    const now = new Date().toISOString();

    const { data: existing } = await db.from("reports").select("id, status").eq("session_id", session.id).eq("kind", b.audience).maybeSingle();
    if (!b.on) {
      if (existing) await db.from("share_grants").update({ revoked_at: now }).eq("report_id", existing.id).is("revoked_at", null);
      await db.from("audit_log").insert({ actor: caller.userId, action: `revoke_share_${b.audience}`, target: session.id });
      return { shared: false };
    }

    const summary = existing?.status === "released" ? existing : await generateSummary(
      b.audience, session.id, bundle.report.content as ReportG9 | ReportG11, bundle.profile!, bundle.verdict, caller.learner.first_name,
    );
    let link: string | null = null;
    let token_hash: string | null = null;
    if (b.audience === "parent") {
      const token = randomBytes(24).toString("base64url");
      token_hash = createHash("sha256").update(token).digest("hex");
      link = `${serverEnv().NEXT_PUBLIC_APP_URL}/p/${token}`;
      // One live parent link at a time: making a new one revokes the old.
      await db.from("share_grants").update({ revoked_at: now }).eq("report_id", summary.id).eq("audience", "parent").is("revoked_at", null);
    } else {
      const { data: live } = await db.from("share_grants").select("id").eq("report_id", summary.id).eq("audience", "teacher").is("revoked_at", null).limit(1);
      if (live?.length) return { shared: true, pending: summary.status !== "released" };
    }
    await db.from("share_grants").insert({ report_id: summary.id, learner_id: caller.learner.id, audience: b.audience, token_hash });
    await db.from("audit_log").insert({ actor: caller.userId, action: `grant_share_${b.audience}`, target: session.id });
    return { shared: true, link, pending: summary.status !== "released" };
  }),
};
