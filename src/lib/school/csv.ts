/** Small, dependency-free CSV parsing for school uploads (SA-SAMS marks exports, rosters). Pure. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (q) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === "," || ch === ";") { row.push(cell.trim()); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

export function csvObjects(text: string): Record<string, string>[] {
  const [head, ...rest] = parseCsv(text);
  if (!head) return [];
  const keys = head.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  return rest.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}

export interface MarkImportRow { learner_ref: string; grade: number; term_label: string; subject: string; percentage: number }
export interface ImportResult<T> { rows: T[]; errors: string[] }

/** Columns: learner_ref (or admission_no), grade, term (or term_label), subject, percentage (or mark). */
export function parseMarksCsv(text: string, knownSubjects: Set<string>): ImportResult<MarkImportRow> {
  const out: MarkImportRow[] = [], errors: string[] = [];
  csvObjects(text).forEach((o, i) => {
    const line = i + 2;
    const ref = o.learner_ref || o.admission_no || o.admission_number || "";
    const grade = Number(o.grade);
    const term = o.term_label || o.term || "";
    const subject = o.subject || "";
    const pct = Number((o.percentage || o.mark || "").replace("%", ""));
    if (!ref) return errors.push(`line ${line}: missing learner_ref`);
    if (![9, 10, 11, 12].includes(grade)) return errors.push(`line ${line}: grade must be 9–12`);
    if (!term) return errors.push(`line ${line}: missing term`);
    if (!knownSubjects.has(subject)) return errors.push(`line ${line}: unknown subject "${subject}"`);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return errors.push(`line ${line}: percentage must be 0–100`);
    out.push({ learner_ref: ref, grade, term_label: term, subject, percentage: pct });
  });
  return { rows: out, errors };
}

export interface RosterRow { first_name: string; last_name: string; current_grade: number; class_label: string | null; school_learner_ref: string | null }
/** Columns: first_name, last_name, grade, class, learner_ref. No ID numbers (spec 09 §4). */
export function parseRosterCsv(text: string): ImportResult<RosterRow> {
  const out: RosterRow[] = [], errors: string[] = [];
  csvObjects(text).forEach((o, i) => {
    const line = i + 2;
    if (o.id_number || o.id_no || o.identity_number) return errors.push(`line ${line}: remove ID numbers — they are never collected`);
    const grade = Number(o.grade);
    if (!o.first_name || !o.last_name) return errors.push(`line ${line}: first_name and last_name are required`);
    if (![8, 9, 10, 11, 12].includes(grade)) return errors.push(`line ${line}: grade must be 8–12`);
    out.push({ first_name: o.first_name, last_name: o.last_name, current_grade: grade, class_label: o.class || o.class_label || null, school_learner_ref: o.learner_ref || o.admission_no || null });
  });
  return { rows: out, errors };
}

/** Learner login codes: no look-alike characters (0/O, 1/I/L) so they're easy to type from paper. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function loginCode(rand: () => number, first: string): string {
  const prefix = (first.replace(/[^A-Za-z]/g, "").toUpperCase() + "XXX").slice(0, 3).replace(/[OIL]/g, "X");
  let tail = "";
  for (let i = 0; i < 5; i++) tail += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `${prefix}-${tail}`;
}
