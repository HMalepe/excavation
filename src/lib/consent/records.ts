/** Pure helpers for the consent register (no I/O): who is cleared to start, and validating a new record. */
export interface ConsentRow {
  learner_id: string; guardian_name: string; relationship: string;
  consent_service: boolean; consent_ai_crossborder: boolean; consent_wellbeing: boolean; consent_research: boolean;
  form_version: string; given_at: string; withdrawn_at: string | null; evidence_ref: string | null;
}
export type ConsentStatus = "on_file" | "withdrawn" | "missing";

/** Same rule the learner flow enforces (hasValidGuardianConsent): newest active record with all three required consents. */
export function consentStatus(rows: ConsentRow[]): { status: ConsentStatus; latest: ConsentRow | null } {
  const sorted = [...rows].sort((a, b) => b.given_at.localeCompare(a.given_at));
  const active = sorted.find((r) => !r.withdrawn_at);
  if (active && active.consent_service && active.consent_ai_crossborder && active.consent_wellbeing) return { status: "on_file", latest: active };
  if (sorted.length && !active) return { status: "withdrawn", latest: sorted[0]! };
  return { status: "missing", latest: sorted[0] ?? null };
}

export interface ConsentInput { guardian_name: string; relationship: string; consent_research: boolean; evidence_ref?: string | null; given_on?: string | null }
export function validateConsentInput(i: ConsentInput): string[] {
  const errors: string[] = [];
  if (i.guardian_name.trim().length < 2) errors.push("Enter the parent or guardian's full name.");
  if (i.relationship.trim().length < 2) errors.push("Enter their relationship to the learner (for example mother, grandmother, legal guardian).");
  if (i.given_on) {
    const d = new Date(i.given_on);
    if (Number.isNaN(d.getTime())) errors.push("The date on the form isn't a valid date.");
    else if (d.getTime() > Date.now() + 86_400_000) errors.push("The date on the form is in the future.");
  }
  return errors;
}

export function summarise(statuses: ConsentStatus[]) {
  const n = statuses.length, onFile = statuses.filter((s) => s === "on_file").length;
  return { total: n, onFile, missing: statuses.filter((s) => s === "missing").length, withdrawn: statuses.filter((s) => s === "withdrawn").length, cleared: n ? onFile / n : 0 };
}
