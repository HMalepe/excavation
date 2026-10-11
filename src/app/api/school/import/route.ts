import { randomInt } from "node:crypto";
import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { subjectMap, LIFE_ORIENTATION } from "@/lib/config/subjectMap";
import { G9_SNAPSHOT_SUBJECTS } from "@/lib/config/questionBank";
import { loginCode, parseMarksCsv, parseRosterCsv } from "@/lib/school/csv";
import { retainUntil } from "@/lib/privacy/retention";

const Body = z.object({ kind: z.enum(["roster", "marks"]), csv: z.string().max(2_000_000) });
const KNOWN = new Set([...subjectMap.subjects.map((s) => s.name), ...G9_SNAPSHOT_SUBJECTS, "Home Language", "First Additional Language", LIFE_ORIENTATION]);

/** Roster and SA-SAMS marks import for the admin's OWN school only. Returns line-level errors. */
export const POST = handle(async (req: Request) => {
  const admin = await requireRole("school_admin");
  if (!admin.schoolId) throw new HttpError(403, "No school");
  const { kind, csv } = Body.parse(await req.json());
  const db = adminDb();

  if (kind === "roster") {
    const { rows, errors } = parseRosterCsv(csv);
    if (errors.length) return ok({ imported: 0, errors });
    const rand = () => randomInt(1_000_000) / 1_000_000;
    const created: { name: string; grade: number; class: string | null; code: string }[] = [];
    for (const r of rows) {
      const code = loginCode(rand, r.first_name);
      const { error } = await db.from("learners").insert({ ...r, school_id: admin.schoolId, login_code: code, retain_until: retainUntil(r.current_grade) });
      if (error) errors.push(`${r.first_name} ${r.last_name}: ${error.message}`);
      else created.push({ name: `${r.first_name} ${r.last_name}`, grade: r.current_grade, class: r.class_label, code });
    }
    await audit(admin.userId, "import_roster", `${admin.schoolId}:${created.length}`);
    return ok({ imported: created.length, errors, codes: created });
  }

  const { rows, errors } = parseMarksCsv(csv, KNOWN);
  if (errors.length) return ok({ imported: 0, errors });
  const refs = [...new Set(rows.map((r) => r.learner_ref))];
  const { data: learners } = await db.from("learners").select("id, school_learner_ref").eq("school_id", admin.schoolId).in("school_learner_ref", refs);
  const byRef = new Map((learners ?? []).map((l) => [l.school_learner_ref, l.id]));
  const missing = refs.filter((r) => !byRef.has(r));
  if (missing.length) return ok({ imported: 0, errors: missing.map((m) => `learner_ref ${m} is not on your roster`) });
  const { error } = await db.from("marks").upsert(rows.map((r) => ({
    learner_id: byRef.get(r.learner_ref), grade: r.grade, term_label: r.term_label, subject: r.subject, percentage: r.percentage, source: "school_import", is_estimate: false,
  })), { onConflict: "learner_id,grade,term_label,subject" });
  if (error) throw new Error(error.message);
  await audit(admin.userId, "import_marks", `${admin.schoolId}:${rows.length}`);
  return ok({ imported: rows.length, errors: [] });
});
