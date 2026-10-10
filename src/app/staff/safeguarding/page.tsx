import { pageRole } from "@/lib/auth/guards";
import { one } from "@/lib/db/one";
import { adminDb } from "@/lib/db/admin";
import { audit } from "@/lib/audit";
import { StaffShell, STAFF_NAV } from "@/components/ui/StaffShell";
import { SafeguardingActions } from "@/components/client/SafeguardingActions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Safeguarding" };

const t = (s: string | null) => (s ? new Date(s).toLocaleString("en-ZA") : "—");

/** Excavation safeguarding lead view (spec 09 §5.2): who was notified, when, and confirmation received. */
export default async function StaffSafeguarding() {
  const staff = await pageRole(["excavation_staff"]);
  const { data: events } = await adminDb().from("safeguarding_events")
    .select("*, learners(first_name, last_name, current_grade, schools(name)), conversation_messages(content)")
    .order("created_at", { ascending: false }).limit(200);
  await audit(staff.userId, "view_safeguarding_log", "safeguarding_events");
  return (
    <StaffShell title="Safeguarding log" nav={STAFF_NAV}>
      <p className="text-muted">Every flag lands here the moment it&apos;s raised. Urgent ones are also emailed to the school&apos;s designated contact and backup. If a school hasn&apos;t confirmed within 4 school hours, you get an escalation email to phone them. Review every hard event quarterly with the clinical advisor.</p>
      <ul className="space-y-3">
        {(events ?? []).map((e) => {
          const l = one(e.learners) as unknown as { first_name: string; last_name: string; current_grade: number; schools: { name: string } };
          return (
            <li key={e.id} className={`card space-y-2 ${e.level === "hard" && !e.school_confirmed_at ? "border-danger" : ""}`}>
              <div className="flex flex-wrap justify-between gap-2">
                <p><strong className={e.level === "hard" ? "text-danger" : ""}>{e.level.toUpperCase()}</strong> · {l.first_name} {l.last_name} · Gr {l.current_grade} · {l.schools.name} · {e.trigger_source}</p>
                <p className="text-sm text-muted">{t(e.created_at)}</p>
              </div>
              {e.level === "hard" && one(e.conversation_messages as { content: string } | null)?.content && <p className="rounded-xl bg-canvas p-3 text-sm">&ldquo;{one(e.conversation_messages as { content: string } | null)!.content}&rdquo;</p>}
              {e.level === "soft" && e.trigger_source === "scored_layer" && <p className="text-sm text-muted">{e.notes}</p>}
              {e.level === "hard" && <p className="text-sm text-muted">School notified {t(e.school_notified_at)} · confirmed {t(e.school_confirmed_at)} · escalated {t(e.escalated_at)} · reviewed {t(e.reviewed_at)}</p>}
              {e.level === "hard" && <SafeguardingActions eventId={e.id} confirmed={!!e.school_confirmed_at} reviewed={!!e.reviewed_at} />}
              {e.level === "hard" && e.notes && <pre className="whitespace-pre-wrap text-xs text-muted">{e.notes}</pre>}
            </li>
          );
        })}
        {!events?.length && <li className="text-muted">No events.</li>}
      </ul>
    </StaffShell>
  );
}
