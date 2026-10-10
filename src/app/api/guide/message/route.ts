import { after } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/http";
import { HttpError, requireLearner } from "@/lib/auth/guards";
import { getOrCreateSession, hasValidGuardianConsent } from "@/lib/session/service";
import { guideTurn, MAX_LEARNER_CHARS } from "@/lib/guide/turn";
import { runReportPipeline } from "@/lib/pipeline/report";

export const runtime = "nodejs";
export const maxDuration = 300; // report generation runs in after() once the session completes

const Body = z.object({ text: z.string().max(MAX_LEARNER_CHARS).nullable() });

/** POST {text} → streamed reply text, then "\u001e" + {complete, safetyStop, risk}. text:null = retry. */
export const POST = handle(async (req: Request) => {
  const caller = await requireLearner();
  const session = await getOrCreateSession(caller.learner);
  if (!session) throw new HttpError(409, "No session");
  if (!(await hasValidGuardianConsent(caller.learner.id))) throw new HttpError(403, "Consent is needed before you continue.");
  const { text } = Body.parse(await req.json());
  const { stream, done } = await guideTurn(session, caller.learner, text);
  after(async () => {
    const outcome = await done;
    if (outcome.complete) await runReportPipeline(session.id);
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
});
