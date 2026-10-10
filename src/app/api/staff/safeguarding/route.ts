import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";

const Body = z.object({
  eventId: z.string().uuid(),
  action: z.enum(["confirm_school", "note", "review_complete"]),
  note: z.string().max(2000).optional(),
});

/**
 * Excavation safeguarding lead actions (spec 09 §5.2): record a phoned-in confirmation, add staff notes,
 * and complete the review — which unlocks the session so the learner can finish later (results are
 * never withheld as punishment).
 */
export const POST = handle(async (req: Request) => {
  const staff = await requireRole("excavation_staff");
  const b = Body.parse(await req.json());
  const db = adminDb();
  const { data: ev } = await db.from("safeguarding_events").select("*").eq("id", b.eventId).single();
  if (!ev) throw new HttpError(404, "Not found");
  const now = new Date().toISOString();
  await audit(staff.userId, `safeguarding_${b.action}`, b.eventId);

  if (b.action === "confirm_school") await db.from("safeguarding_events").update({ school_confirmed_at: ev.school_confirmed_at ?? now }).eq("id", b.eventId);
  if (b.action === "note" && b.note) await db.from("safeguarding_events").update({ notes: [ev.notes, `[${now}] ${b.note}`].filter(Boolean).join("\n") }).eq("id", b.eventId);
  if (b.action === "review_complete") {
    await db.from("safeguarding_events").update({ reviewed_by: staff.userId, reviewed_at: now }).eq("id", b.eventId);
    const { data: session } = await db.from("sessions").select("id, status, stage").eq("id", ev.session_id).single();
    if (session?.status === "safety_stop") {
      // Append-only: tell The Guide it may continue, rather than editing earlier history.
      await db.from("conversation_messages").insert({ session_id: session.id, role: "system", question_ref: "safety-review", content: "safety_review_complete: a trained adult has checked in with the learner. If they want to continue, gently pick the questions up from where you stopped. Do not repeat the crisis resources unless they raise something new." });
      await db.from("sessions").update({ status: session.stage === "conversation" ? "conversation" : "scored_layer", locked_at: null }).eq("id", session.id);
    }
  }
  return ok();
});
