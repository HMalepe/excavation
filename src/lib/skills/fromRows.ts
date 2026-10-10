/**
 * Storage mapping for readiness checks + tasters (item_responses rows). Pure.
 *   DX:<itemId>   value = chosen ORIGINAL option index (-1 = "not sure"), response_ms
 *   DXS:<check>   the learner skipped the rest of that check
 *   TT:<taster>   value = after-enjoyment (1..5, null if skipped), value_json = TasterInput
 * Every id contains ":", so the norming job (which skips ":" ids) never mixes them into scales.
 */
import { CHECK_IDS, TASTER_IDS, type CheckId, type TasterId } from "./content";
import { servedItems } from "./engine";
import type { CheckInput, SkillsInput, SkillsPlan, TasterInput } from "./types";

export const DX = (itemId: string) => `DX:${itemId}`;
export const DXS = (check: CheckId) => `DXS:${check}`;
export const TT = (taster: TasterId) => `TT:${taster}`;
export const isSkillRow = (itemId: string) => itemId.startsWith("DX:") || itemId.startsWith("DXS:") || itemId.startsWith("TT:");

export interface SkillRow { item_id: string; value: number | null; value_json: unknown; response_ms: number | null }

export function skillsInputFromRows(plan: SkillsPlan, rows: SkillRow[]): SkillsInput {
  const by = new Map(rows.map((r) => [r.item_id, r]));
  const input: SkillsInput = { checks: {}, tasters: {} };
  for (const c of CHECK_IDS) {
    const served = servedItems(plan, c);
    const answers: CheckInput["answers"] = {};
    for (const id of served) {
      const r = by.get(DX(id));
      if (r && typeof r.value === "number") answers[id] = { choice: r.value, ms: r.response_ms };
    }
    const skipped = by.has(DXS(c));
    if (Object.keys(answers).length || skipped) input.checks[c] = { served, answers, skipped };
  }
  for (const t of TASTER_IDS) {
    const r = by.get(TT(t));
    if (r?.value_json) input.tasters[t] = r.value_json as TasterInput;
  }
  return input;
}
