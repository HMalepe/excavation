import { handle, ok } from "@/lib/http";
import { HttpError, requireLearner } from "@/lib/auth/guards";
import { getOrCreateSession } from "@/lib/session/service";
import { runAction } from "@/lib/session/actions";

/** One endpoint per learner action: POST /api/learn/<action>. Identity from the session cookie only. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ action: string }> }) => {
  const { action } = await ctx.params;
  const caller = await requireLearner();
  const session = await getOrCreateSession(caller.learner);
  if (!session) throw new HttpError(409, "There's no session for your grade right now.");
  const body = await req.json().catch(() => ({}));
  const result = await runAction(action, caller, session, body);
  return ok({ ok: true, ...(result as object) });
});
