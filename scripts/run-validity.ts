/**
 * Readiness checks + taster tasks: do they earn their weight?
 *   npm run validity            (reads .env.local; service role)
 *
 * 1. Check items: difficulty and discrimination per question → reports-out/check-items.csv
 * 2. Predictive validity: does each Grade 9 check predict Grade 10/11 marks BEYOND Grade 9 marks?
 * 3. Tasters: does a "pull" towards a family predict the subjects actually taken in Grade 10?
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { itemIndex, tasterById, TASTER_IDS } from "../src/lib/skills/content";
import { checkItemStatsCsv, validity, type ItemAnswers, type ValidityRow } from "../src/lib/skills/validity";
import { combinationById } from "../src/lib/config/subjectMap";
import type { ScoreProfile } from "../src/lib/scoring/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(url, key, { auth: { persistSession: false } });

const { data: sessions, error } = await db.from("sessions")
  .select("id, learner_id, score_profiles(profile)").eq("touchpoint", "G9_FOUNDATION");
if (error) throw error;
const g9 = (sessions ?? []).map((s) => {
  const sp = s.score_profiles as unknown as { profile: ScoreProfile } | { profile: ScoreProfile }[] | null;
  const profile = Array.isArray(sp) ? sp[0]?.profile : sp?.profile;
  return { id: s.id as string, learner: s.learner_id as string, profile };
}).filter((s) => s.profile?.skills);
console.log(`Grade 9 sessions with checks/tasters: ${g9.length}`);

// ---- 1. item statistics ----
const learners: ItemAnswers[] = [];
for (let i = 0; i < g9.length; i += 200) {
  const ids = g9.slice(i, i + 200).map((s) => s.id);
  const { data } = await db.from("item_responses").select("session_id, item_id, value").in("session_id", ids).like("item_id", "DX:%");
  const by = new Map<string, ItemAnswers>();
  for (const r of data ?? []) {
    const itemId = (r.item_id as string).slice(3);
    const meta = itemIndex.get(itemId);
    if (!meta || typeof r.value !== "number") continue;
    const a = by.get(r.session_id) ?? {};
    a[itemId] = r.value === -1 ? null : r.value === meta.item.answer;
    by.set(r.session_id, a);
  }
  learners.push(...by.values());
}
mkdirSync("reports-out", { recursive: true });
writeFileSync("reports-out/check-items.csv", checkItemStatsCsv(learners));
console.log(`Item statistics → reports-out/check-items.csv (${learners.length} learners)`);

// ---- 2. predictive validity ----
const learnerIds = g9.map((s) => s.learner);
const later = new Map<string, Record<string, number>>();
for (let i = 0; i < learnerIds.length; i += 200) {
  const { data } = await db.from("marks").select("learner_id, grade, subject, percentage, recorded_at")
    .in("learner_id", learnerIds.slice(i, i + 200)).in("grade", [10, 11]).order("recorded_at", { ascending: true });
  for (const m of data ?? []) {
    const rec = later.get(m.learner_id) ?? {};
    rec[m.subject as string] = Number(m.percentage);   // latest wins (ordered ascending)
    later.set(m.learner_id, rec);
  }
}
const average = (r: Record<string, number>) => {
  const v = Object.entries(r).filter(([k]) => k !== "Life Orientation").map(([, x]) => x);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};
const PAIRS: { check: "maths" | "science" | "reading"; mark9: string; outcome: string; get: (r: Record<string, number>) => number | null | undefined }[] = [
  { check: "maths", mark9: "Mathematics", outcome: "Mathematics (G10/11)", get: (r) => r["Mathematics"] },
  { check: "science", mark9: "Natural Sciences", outcome: "Physical Sciences (G10/11)", get: (r) => r["Physical Sciences"] },
  { check: "science", mark9: "Natural Sciences", outcome: "Life Sciences (G10/11)", get: (r) => r["Life Sciences"] },
  { check: "reading", mark9: "Social Sciences", outcome: "average of all subjects (G10/11)", get: average },
];
for (const p of PAIRS) {
  const rows: ValidityRow[] = [];
  for (const s of g9) {
    const c = s.profile!.skills!.checks[p.check];
    const m9 = s.profile!.marks[p.mark9];
    const out = later.get(s.learner);
    const y = out ? p.get(out) : null;
    if (c?.reliable && typeof c.score === "number" && typeof m9 === "number" && typeof y === "number") rows.push({ mark9: m9, check: c.score, outcome: y });
  }
  const v = validity(rows);
  console.log(`${p.check} check → ${p.outcome}: n=${v.n} r(mark)=${v.r_mark ?? "—"} r(check)=${v.r_check ?? "—"} ΔR²=${v.delta_r2 ?? "—"} · ${v.verdict}`);
}

// ---- 3. tasters vs subjects taken ----
const { data: fet } = await db.from("learners").select("id, fet_subjects").in("id", learnerIds);
const taken = new Map((fet ?? []).map((l) => [l.id as string, new Set(l.fet_subjects as string[])]));
for (const id of TASTER_IDS) {
  const t = tasterById.get(id)!;
  const subjects = new Set(t.links.flatMap((c) => combinationById.get(c)?.core_electives ?? []));
  const groups: Record<string, { n: number; took: number }> = {};
  for (const s of g9) {
    const sig = s.profile!.skills!.tasters[id]?.signal;
    const fs = taken.get(s.learner);
    if (!sig || !fs?.size) continue;
    const g = (groups[sig] ??= { n: 0, took: 0 });
    g.n++; if ([...subjects].some((x) => fs.has(x))) g.took++;
  }
  const line = Object.entries(groups).map(([k, g]) => `${k}: ${g.took}/${g.n}`).join(" · ");
  console.log(`taster ${id} → took a linked subject in Grade 10: ${line || "no Grade 10 data yet"}`);
}
