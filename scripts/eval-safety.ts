/**
 * Runs the production safety screen (model + keyword floor) over the labelled corpus and reports recall.
 *   npm run eval:safety        (needs ANTHROPIC_API_KEY and the usual server env in .env.local; costs a few cents)
 * Exits 1 if the release gate fails (see GATE in src/lib/safeguarding/evaluate.ts). Run it before every change
 * to the screen prompt, the keyword floor, or the model.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { screenMessage } from "../src/lib/ai/safety";
import { evaluate, gate, type Outcome } from "../src/lib/safeguarding/evaluate";
import { CORPUS } from "../tests/safety/corpus";

const cases = CORPUS.filter((c) => c.text.trim());
const rows: Outcome[] = new Array(cases.length);
const detail: { text: string; label: string; got: string; source: string; reason: string }[] = new Array(cases.length);
let next = 0;
async function worker() {
  while (next < cases.length) {
    const i = next++, c = cases[i]!;
    const res = await screenMessage(c.text);
    rows[i] = { label: c.label, got: res.risk, lang: c.lang, text: c.text };
    detail[i] = { text: c.text, label: c.label, got: res.risk, source: res.source, reason: res.reason };
  }
}
await Promise.all(Array.from({ length: 4 }, worker));

const r = evaluate(rows);
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
console.log(`\nSafety screen on ${r.total} labelled messages`);
console.log("rows = true label, columns = screen said");
console.log("            none  soft  hard");
for (const l of ["none", "soft", "hard"] as const) console.log(`${l.padEnd(10)}  ${String(r.matrix[l].none).padStart(4)}  ${String(r.matrix[l].soft).padStart(4)}  ${String(r.matrix[l].hard).padStart(4)}`);
console.log(`\nhard recall        ${pct(r.hardRecall)}`);
console.log(`concern recall     ${pct(r.concernRecall)}   (soft or hard raised at least a soft flag)`);
console.log(`false-hard rate    ${pct(r.falseHardRate)}`);
console.log(`false-flag rate    ${pct(r.falseFlagRate)}`);
for (const [l, v] of Object.entries(r.byLang)) console.log(`  ${l.padEnd(3)} n=${v.n}  hard recall ${v.hardRecall === null ? "-" : pct(v.hardRecall)}`);
if (r.hardMissedAsNone.length) { console.log("\nMISSED (hard → none):"); r.hardMissedAsNone.forEach((o) => console.log("  - " + o.text)); }
if (r.hardUnderCalled.length) { console.log("\nUnder-called (hard → soft):"); r.hardUnderCalled.forEach((o) => console.log("  - " + o.text)); }

mkdirSync("reports-out", { recursive: true });
writeFileSync("reports-out/safety-eval.json", JSON.stringify({ ranAt: new Date().toISOString(), summary: r, detail }, null, 2));
const fails = gate(r);
if (fails.length) { console.error("\nGATE FAILED:\n  " + fails.join("\n  ")); process.exit(1); }
console.log("\nGate passed.");
