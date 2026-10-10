/**
 * Run the norming job by hand and write the item-level statistics CSV for review.
 *   npm run norms            (reads .env.local)
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { runNorming } from "../src/lib/norming/job";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(url, key, { auth: { persistSession: false } });

mkdirSync("reports-out", { recursive: true });
for (const grade of [9, 11] as const) {
  const r = await runNorming(db, grade);
  const file = `reports-out/item-stats-grade${grade}-v${r.version}.csv`;
  writeFileSync(file, r.item_stats_csv);
  console.log(`Grade ${grade}: v${r.version} · n=${r.n} · ${r.norm_state} · CSV → ${file}`);
  const weak = Object.entries(r.alphas).filter(([, a]) => a !== null && a < 0.7).map(([k, a]) => `${k} α=${a}`);
  if (weak.length) console.log(`  scales below α 0.70 (rewrite in the next item version): ${weak.join(", ")}`);
}
