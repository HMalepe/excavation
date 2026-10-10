import { z } from "zod";
import { handle, ok } from "@/lib/http";
import { HttpError, requireRole } from "@/lib/auth/guards";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { combinationById, subjectVectors } from "@/lib/config/subjectMap";

const subject = z.string().refine((s) => subjectVectors.has(s), "unknown FET subject");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();
const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const phone = z.string().regex(/^\+?[0-9 ]{9,16}$/, "phone number");

/** School admin uploads (spec 10 Step 7): offered combinations, readiness overrides, deadlines, safeguarding contacts. */
const Body = z.object({
  offered_combination_ids: z.array(z.string().refine((id) => combinationById.has(id), "unknown combination")),
  readiness_overrides: z.record(subject, z.object({ needs: z.record(z.string(), z.number().min(0).max(100)) })),
  subject_change_deadline_g10: date,
  subject_change_deadline_g11: date,
  safeguarding_contact_name: z.string().min(2).max(120),
  safeguarding_contact_phone: phone,
  safeguarding_contact_email: z.string().email(),
  safeguarding_backup_name: z.string().min(2).max(120),
  safeguarding_backup_phone: phone,
  safeguarding_backup_email: z.string().email().nullable(),
  offered_subjects_fet: z.array(subject),
  timetable_allows: z.record(subject, z.boolean()),
  performance_overrides: z.record(subject, z.number().min(50).max(80)),
  school_day_start: time,
  school_day_end: time,
  partnership_agreement_signed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const POST = handle(async (req: Request) => {
  const admin = await requireRole("school_admin");
  if (!admin.schoolId) throw new HttpError(403, "No school");
  const b = Body.parse(await req.json());
  const { error } = await adminDb().from("school_settings").upsert({ school_id: admin.schoolId, ...b, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await audit(admin.userId, "update_school_settings", admin.schoolId);
  return ok();
});
