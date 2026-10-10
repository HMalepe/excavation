import "server-only";
/**
 * What the browser gets for checks and tasters. Check views carry NO answer key (options are sent
 * as {i, text} in a per-learner shuffled order). Taster views do carry keys and feedback, because
 * the feedback after each answer is the point of a taster.
 */
import { checkById, itemIndex, tasterById, tastersConfig, variantIndex } from "./content";
import { optionOrder, servedItems } from "./engine";
import type { SkillsProgress } from "@/lib/session/service";
import type { CheckId, TasterId } from "./content";

export interface OptionView { i: number; text: string }

export interface CheckView {
  check: CheckId;
  title: string;
  intro: string;
  minutes: number;
  checkNumber: number;
  checkCount: number;
  index: number;
  total: number;
  itemId: string;
  stem: string;
  options: OptionView[];
  passage: { title: string; text: string } | null;
  showIntro: boolean;
}

export function checkView(sessionId: string, sk: SkillsProgress): CheckView {
  const check = sk.plan.order[sk.check]!;
  const cfg = checkById(check);
  const served = servedItems(sk.plan, check);
  const itemId = served[sk.item]!;
  const { item } = itemIndex.get(itemId)!;
  const variant = [...variantIndex.values()].find((v) => v.check === check && v.variant.items.some((i) => i.id === itemId))!.variant;
  return {
    check, title: cfg.title, intro: cfg.intro, minutes: cfg.minutes,
    checkNumber: sk.check + 1, checkCount: sk.plan.order.length,
    index: sk.item, total: served.length,
    itemId, stem: item.stem,
    options: optionOrder(sessionId, itemId, item.options.length).map((i) => ({ i, text: item.options[i]! })),
    passage: variant.passage ?? null,
    showIntro: sk.item === 0,
  };
}

export interface TasterStepView { stem: string; options: OptionView[]; answer: number | null; feedback: string }
export interface TasterView {
  id: TasterId;
  title: string;
  work: string;
  before_prompt: string;
  scene: string;
  visual: "poster_ab" | null;
  steps: TasterStepView[];
  bonus: { title: string; scene: string; steps: TasterStepView[] };
  index: number;
  total: number;
  before_scale: string[];
  after_scale: string[];
}

export function tasterView(sessionId: string, sk: SkillsProgress): TasterView {
  const id = sk.plan.tasters[sk.taster]!;
  const t = tasterById.get(id)!;
  const step = (prefix: string) => (s: (typeof t.steps)[number]): TasterStepView => ({
    stem: s.stem,
    // Two-option visual choices keep their authored order (it matches the picture labels).
    options: (s.options.length === 2 ? [0, 1] : optionOrder(sessionId, `${id}:${prefix}${s.id}`, s.options.length)).map((i) => ({ i, text: s.options[i]! })),
    answer: s.answer, feedback: s.feedback,
  });
  return {
    id, title: t.title, work: t.work, before_prompt: t.before_prompt, scene: t.scene, visual: t.visual ?? null,
    steps: t.steps.map(step("")),
    bonus: { title: t.bonus.title, scene: t.bonus.scene, steps: t.bonus.steps.map(step("b")) },
    index: sk.taster, total: sk.plan.tasters.length,
    before_scale: tastersConfig.before_scale, after_scale: tastersConfig.after_scale,
  };
}
