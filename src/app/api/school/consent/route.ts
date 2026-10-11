import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { CONSENT_FORM_VERSION } from "@/lib/consent/form";
import { validateConsentInput } from "@/lib/consent/records";
import { parseConsentCsv } from "@/lib/school/csv";

const Record = z.object({
  action: z.literal("record"), learnerId: z.string().uuid(), guardian_name: z.string().max(120), relationship: z.string().max(60),
  consent_research: z.boolean().default(false), evidence_ref: z.string().max(120).nullable().optional(), given_on: z.string().max(20).nullable().optional(),
});
const Withdraw = z.object({ action: z.literal("withdraw"), learnerId: z.string().uuid() });
const Import = z.object({ action: z.literal("import"), csv: z.string().max(1_000_000) });
const Body = z.discriminatedUnion("action", [Record, Withdraw, Import]);

/**
 * The school's consent register (spec 09 §3): the school records that it holds a signed form, the learner is
 * cleared to start. Only for the admin's OWN school. A declined form is never recorded: no row = no access.
 */
export const POST = handle(async (req: Request) => {
  const admin = await requireRole("school_admin");
  if (!admin.schoolId) throw new HttpError(403, "No school");
  const b = Body.parse(await req.json());
  const db = adminDb();
  const insert = (learnerId: string, r: { guardian_name: string; relationship: string; consent_research: boolean; evidence_ref?: string | null; given_on?: string | null }) =>
    db.from("guardian_consents").insert({
      learner_id: learnerId, guardian_name: r.guardian_name.trim(), relationship: r.relationship.trim(), method: "paper_upload",
      evidence_ref: r.evidence_ref ? `paper:${r.evidence_ref}` : "paper:held at school",
      consent_service: true, consent_ai_crossborder: true, consent_wellbeing: true, consent_research: r.consent_research,
      form_version: CONSENT_FORM_VERSION, given_at: r.given_on ? new Date(r.given_on).toISOString() : new Date().toISOString(),
    });

  if (b.action === "import") {
    const { rows, errors } = parseConsentCsv(b.csv);
    if (errors.length) return ok({ imported: 0, errors });
    const refs = [...new Set(rows.map((r) => r.learner_ref))];
    const { data: learners } = await db.from("learners").select("id, school_learner_ref").eq("school_id", admin.schoolId).in("school_learner_ref", refs);
    const byRef = new Map((learners ?? []).map((l) => [l.school_learner_ref, l.id]));
    const out: string[] = []; let n = 0;
    for (const r of rows) {
      const id = byRef.get(r.learner_ref);
      if (!id) { out.push(`learner_ref ${r.learner_ref} is not on your roster`); continue; }
      const bad = validateConsentInput({ guardian_name: r.guardian_name, relationship: r.relationship, consent_research: r.consent_research, given_on: r.given_on });
      if (bad.length) { out.push(`${r.learner_ref}: ${bad[0]}`); continue; }
      const { error } = await insert(id, r);
      if (error) out.push(`${r.learner_ref}: ${error.message}`); else n++;
    }
    await audit(admin.userId, "import_consents", `${admin.schoolId}:${n}`);
    return ok({ imported: n, errors: out });
  }

  const { data: learner } = await db.from("learners").select("id, school_id").eq("id", b.learnerId).maybeSingle();
  if (!learner || learner.school_id !== admin.schoolId) throw new HttpError(404, "That learner isn't at your school.");

  if (b.action === "withdraw") {
    const { error } = await db.from("guardian_consents").update({ withdrawn_at: new Date().toISOString() }).eq("learner_id", b.learnerId).is("withdrawn_at", null);
    if (error) throw new Error(error.message);
    await audit(admin.userId, "withdraw_consent", b.learnerId);
    return ok({ status: "withdrawn" });
  }

  const bad = validateConsentInput(b);
  if (bad.length) throw new HttpError(400, bad.join(" "));
  const { error } = await insert(b.learnerId, b);
  if (error) throw new Error(error.message);
  await audit(admin.userId, "record_consent", b.learnerId);
  return ok({ status: "on_file" });
});
