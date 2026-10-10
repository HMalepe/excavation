import { pageRole } from "@/lib/auth/guards";
import { userDb } from "@/lib/db/server";
import { audit } from "@/lib/audit";
import { StaffShell } from "@/components/ui/StaffShell";
import { SafeguardingActions } from "@/components/client/SafeguardingActions";
import { Resources } from "@/components/ui/Resources";

export const dynamic = "force-dynamic";
export const metadata = { title: "Safeguarding" };

/**
 * The school's designated safeguarding contact (spec 09 §5): events for their school only (RLS),
 * content limited to the trigger message. Hard events: confirm the same day.
 */
export default async function SchoolSafeguarding() {
  const c = await pageRole(["safeguarding_contact"]);
  const db = await userDb();
  const { data: events } = await db.from("safeguarding_events").select("id, level, trigger_source, created_at, school_confirmed_at, learner_id, trigger_message_id").eq("level", "hard").order("created_at", { ascending: false });
  // Names and trigger text are read with the service role only for events RLS already returned.
  const { adminDb } = await import("@/lib/db/admin");
  const ids = (events ?? []).map((e) => e.learner_id);
  const msgIds = (events ?? []).map((e) => e.trigger_message_id).filter(Boolean);
  const [{ data: learners }, { data: msgs }] = await Promise.all([
    adminDb().from("learners").select("id, first_name, last_name, current_grade, class_label").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    adminDb().from("conversation_messages").select("id, content").in("id", msgIds.length ? msgIds : [0]),
  ]);
  await audit(c.userId, "view_school_safeguarding", c.schoolId ?? "");
  return (
    <StaffShell title="Safeguarding alerts" nav={[{ href: "/school/safeguarding", label: "Alerts" }]}>
      <p className="text-muted">You&apos;re the designated contact. For an urgent alert: confirm receipt the same day, then follow your school&apos;s safeguarding procedure (Children&apos;s Act duties apply).</p>
      <ul className="space-y-3">
        {(events ?? []).map((e) => {
          const l = learners?.find((x) => x.id === e.learner_id);
          const m = msgs?.find((x) => x.id === e.trigger_message_id);
          return (
            <li key={e.id} className={`card space-y-3 ${!e.school_confirmed_at ? "border-l-[10px] !border-l-danger" : ""}`}>
              <p><strong className="chip !border-danger text-danger">URGENT</strong>  · {l?.first_name} {l?.last_name} · Grade {l?.current_grade} {l?.class_label ?? ""} · {new Date(e.created_at).toLocaleString("en-ZA")}</p>
              {m && <p className="rounded-[14px] border-[1.5px] border-line bg-sunken/60 p-3">&ldquo;{m.content}&rdquo;</p>}
              {e.school_confirmed_at ? <p className="text-sm text-ok">Confirmed {new Date(e.school_confirmed_at).toLocaleString("en-ZA")}</p>
                : <SafeguardingActions eventId={e.id} confirmed={false} reviewed endpoint="/api/school/safeguarding" school />}
            </li>
          );
        })}
        {!events?.length && <li className="text-muted">No alerts.</li>}
      </ul>
      <details className="card"><summary className="font-display font-bold">Crisis resources shown to learners</summary><div className="mt-3"><Resources compact /></div></details>
    </StaffShell>
  );
}
