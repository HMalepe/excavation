import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { eraseLearner, exportLearnerData } from "@/lib/privacy/rights";

const Find = z.object({ action: z.literal("find"), schoolCode: z.string().min(2).max(32), query: z.string().min(2).max(60) });
const Export = z.object({ action: z.literal("export"), learnerId: z.string().uuid() });
const Erase = z.object({ action: z.literal("erase"), learnerId: z.string().uuid(), confirmName: z.string().max(80), safeguardingCleared: z.boolean().optional() });
const Body = z.discriminatedUnion("action", [Find, Export, Erase]);

/** Excavation staff only: find a learner, export their data, or erase it (typed confirmation required). */
export const POST = handle(async (req: Request) => {
  const staff = await requireRole("excavation_staff");
  const b = Body.parse(await req.json());
  const db = adminDb();

  if (b.action === "find") {
    const { data: school } = await db.from("schools").select("id, name").eq("school_code", b.schoolCode.trim().toUpperCase()).maybeSingle();
    if (!school) throw new HttpError(404, "No school with that code.");
    const q = b.query.trim().replace(/[%,]/g, "");
    const { data } = await db.from("learners").select("id, first_name, last_name, current_grade, class_label").eq("school_id", school.id).or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`).limit(20);
    await audit(staff.userId, "privacy_find", `${school.id}`);
    return ok({ school: school.name, learners: data ?? [] });
  }

  if (b.action === "export") {
    const data = await exportLearnerData(b.learnerId, staff.userId);
    if (!data) throw new HttpError(404, "No such learner.");
    return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="learner-data-${b.learnerId.slice(0, 8)}.json"`, "cache-control": "no-store" } });
  }

  const { data: learner } = await db.from("learners").select("first_name").eq("id", b.learnerId).maybeSingle();
  if (!learner) throw new HttpError(404, "No such learner.");
  if (b.confirmName.trim().toLowerCase() !== learner.first_name.trim().toLowerCase()) throw new HttpError(400, "Type the learner's first name exactly to confirm.");
  const r = await eraseLearner(b.learnerId, staff.userId, { safeguardingCleared: b.safeguardingCleared });
  if (!r.ok) throw new HttpError(409, r.reason ?? "Could not erase.");
  return ok({ erased: true });
});
