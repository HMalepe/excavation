/** Retention date rule (spec 09 §4): one year after the learner finishes Grade 12. Pure. */
export function retainUntil(currentGrade: number, today: Date = new Date()): string {
  const yearsToMatric = Math.max(0, 12 - currentGrade);
  const year = today.getUTCFullYear() + yearsToMatric + 1;
  return `${year}-12-31`;
}

export type RetentionAction = "delete" | "anonymise" | "keep";
/** Learners past their date are deleted, unless a parent agreed to anonymised research use: then they are anonymised. */
export function retentionAction(row: { retain_until: string | null; consent_research: boolean }, today: Date = new Date()): RetentionAction {
  if (!row.retain_until) return "keep";
  const due = new Date(`${row.retain_until}T23:59:59Z`).getTime() < today.getTime();
  if (!due) return "keep";
  return row.consent_research ? "anonymise" : "delete";
}
