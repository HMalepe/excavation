import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";

const Body = z.object({ eventId: z.string().uuid(), action: z.literal("confirm") });

/** The school's designated contact confirms receipt from their dashboard (alternative to the email link). */
export const POST = handle(async (req: Request) => {
  const c = await requireRole("safeguarding_contact");
  const { eventId } = Body.parse(await req.json());
  // RLS check: the contact can only see events for learners at their school.
  const { data } = await (await userDb()).from("safeguarding_events").select("id, school_confirmed_at").eq("id", eventId).maybeSingle();
  if (!data) throw new HttpError(404, "Not found");
  if (!data.school_confirmed_at) await adminDb().from("safeguarding_events").update({ school_confirmed_at: new Date().toISOString() }).eq("id", eventId);
  await audit(c.userId, "safeguarding_school_confirm", eventId);
  return ok();
});
