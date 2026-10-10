import { handle, ok } from "@/lib/http";
import { requireCron } from "@/lib/cron/auth";
import { adminDb } from "@/lib/db/admin";
import { notifyEvent } from "@/lib/safeguarding/notify";
import { ESCALATE_AFTER_SCHOOL_HOURS, schoolHoursElapsed } from "@/lib/safeguarding/alert";

export const runtime = "nodejs";

/**
 * Every 15 minutes: a hard event not confirmed by the school within 4 school hours escalates to the
 * Excavation safeguarding lead, who phones the school (spec 09 §5.2.3, spec 10 Step 7).
 */
export const GET = handle(async (req: Request) => {
  requireCron(req);
  const db = adminDb();
  const { data: open } = await db.from("safeguarding_events")
    .select("id, created_at, school_notified_at, learners(school_id)")
    .eq("level", "hard").is("school_confirmed_at", null).is("escalated_at", null);
  const now = new Date();
  const escalated: string[] = [];
  for (const ev of open ?? []) {
    const schoolId = (ev.learners as unknown as { school_id: string }).school_id;
    const { data: s } = await db.from("school_settings").select("school_day_start, school_day_end, timezone").eq("school_id", schoolId).maybeSingle();
    const hours = schoolHoursElapsed(new Date(ev.school_notified_at ?? ev.created_at), now, String(s?.school_day_start ?? "07:30").slice(0, 5), String(s?.school_day_end ?? "14:30").slice(0, 5), s?.timezone ?? "Africa/Johannesburg");
    // Never-notified events (every send failed) escalate immediately.
    if (!ev.school_notified_at || hours >= ESCALATE_AFTER_SCHOOL_HOURS) {
      await notifyEvent(ev.id, null, { escalation: true });
      escalated.push(ev.id);
    }
  }
  return ok({ checked: open?.length ?? 0, escalated });
});
