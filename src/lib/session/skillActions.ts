import "server-only";
import { z } from "zod";
import { randomInt } from "node:crypto";
import { HttpError } from "@/lib/auth/guards";
import { seededRng } from "@/lib/flow/itemPlan";
import { scoreSession } from "@/lib/pipeline/scoring";
import { CHECK_IDS, TASTER_IDS, itemIndex, tasterById } from "@/lib/skills/content";
import { planSkills, servedItems } from "@/lib/skills/engine";
import { DX, DXS, TT } from "@/lib/skills/fromRows";
import type { TasterInput } from "@/lib/skills/types";
import { advanceTo, assertStage, progressOf, updateSession, upsertResponse, type SkillsProgress } from "./service";
import type { SessionRow } from "@/lib/db/types";
import type { ActionDef, Ctx } from "./actions";

const action = <S extends z.ZodType>(body: S, run: (ctx: Ctx, body: z.infer<S>) => Promise<unknown>): ActionDef<S> => ({ body, run });

export const newSkillsProgress = (): SkillsProgress => ({ plan: planSkills(seededRng(randomInt(2 ** 31))), check: 0, item: 0, taster: 0 });

export function skillsOf(s: SessionRow): SkillsProgress {
  const sk = progressOf(s).skills;
  if (!sk) throw new HttpError(409, "This page is out of date. Refresh and try again.");
  return sk;
}

async function saveSkills(s: SessionRow, sk: SkillsProgress) {
  return updateSession(s.id, { progress: { ...progressOf(s), skills: sk } as Record<string, unknown> });
}

/** Move past the current check; after the last one, on to the taster tasks. */
async function nextCheck(s: SessionRow, sk: SkillsProgress) {
  sk.check += 1;
  sk.item = 0;
  if (sk.check >= sk.plan.order.length) {
    return advanceTo(s, "tasters", { progress: { ...progressOf(s), skills: sk } as Record<string, unknown> });
  }
  return saveSkills(s, sk);
}

const rating = z.number().int().min(1).max(5);
const choice = z.number().int().min(0).max(4).nullable();
const tasterBody = z.object({
  id: z.enum(TASTER_IDS),
  skipped: z.boolean(),
  before: rating.nullable(),
  after: rating.nullable(),
  steps: z.array(choice).max(6),
  ms: z.number().int().min(0).max(3_600_000).nullable(),
  bonus: z.object({ steps: z.array(choice).max(6), after: rating.nullable() }).nullable(),
});

export const skillActions = {
  /** One readiness-check answer. Answers lock as you go; no feedback on right/wrong. */
  check_answer: action(z.object({ itemId: z.string().max(20), choice: z.number().int().min(-1).max(4), ms: z.number().int().min(0).max(3_600_000).nullable() }), async ({ session }, b) => {
    assertStage(session, "checks");
    const sk = skillsOf(session);
    const check = sk.plan.order[sk.check]!;
    const served = servedItems(sk.plan, check);
    if (served[sk.item] !== b.itemId) throw new HttpError(409, "That answer is already saved. Refresh the page.");
    const meta = itemIndex.get(b.itemId)!;
    if (b.choice >= meta.item.options.length) throw new HttpError(400, "That answer didn't go through. Refresh and try again.");
    await upsertResponse(session.id, DX(b.itemId), { value: b.choice, response_ms: b.ms });
    sk.item += 1;
    if (sk.item >= served.length) await nextCheck(session, sk);
    else await saveSkills(session, sk);
    return {};
  }),

  /** Skip the rest of the current check. No penalty: checks can only raise. */
  check_skip: action(z.object({ check: z.enum(CHECK_IDS) }), async ({ session }, b) => {
    assertStage(session, "checks");
    const sk = skillsOf(session);
    if (sk.plan.order[sk.check] !== b.check) throw new HttpError(409, "This page is out of date. Refresh and try again.");
    await upsertResponse(session.id, DXS(b.check), { value_json: { skipped_at_item: sk.item } });
    await nextCheck(session, sk);
    return {};
  }),

  /** One taster task, submitted whole (before rating, steps, after rating, optional bonus). */
  taster: action(tasterBody, async ({ session, caller }, b) => {
    assertStage(session, "tasters");
    const sk = skillsOf(session);
    if (sk.plan.tasters[sk.taster] !== b.id) throw new HttpError(409, "This page is out of date. Refresh and try again.");
    const t = tasterById.get(b.id)!;
    if (!b.skipped) {
      if (b.after === null || b.steps.length !== t.steps.length || b.steps.some((c) => c === null)) throw new HttpError(400, "Finish the task (or skip it) first.");
      b.steps.forEach((c, i) => { if (c !== null && c >= t.steps[i]!.options.length) throw new HttpError(400, "That answer didn't go through. Refresh and try again."); });
      if (b.bonus && b.bonus.steps.length > t.bonus.steps.length) throw new HttpError(400, "That answer didn't go through. Refresh and try again.");
    }
    const record: TasterInput = b.skipped
      ? { skipped: true, before: b.before, after: null, steps: [], ms: b.ms, bonus: null }
      : { skipped: false, before: b.before, after: b.after, steps: b.steps, ms: b.ms, bonus: b.bonus };
    await upsertResponse(session.id, TT(b.id), { value: record.after, value_json: record, response_ms: b.ms });
    const next: SkillsProgress = { ...sk, taster: sk.taster + 1 };
    if (next.taster < next.plan.tasters.length) {
      await saveSkills(session, next);
      return {};
    }
    // End of Part 1: score everything so The Guide has it, THEN move on. If scoring fails, nothing
    // has advanced and resubmitting the last task (an idempotent upsert) simply retries.
    const progress = { ...progressOf(session), skills: { ...next, done: true } } as Record<string, unknown>;
    await scoreSession({ ...session, progress }, caller.learner.school_id);
    await advanceTo(session, "break", { progress });
    return {};
  }),

  /** Part 1 done: carry on to The Guide now, or stop and come back later (everything is saved). */
  part1_done: action(z.object({ choice: z.enum(["continue", "later"]) }), async ({ session }, b) => {
    assertStage(session, "break");
    await advanceTo(session, "guide_notice");
    return b.choice === "later" ? { next: "/learn/paused" } : {};
  }),
} as const;
