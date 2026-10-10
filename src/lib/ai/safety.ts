import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, models } from "./client";
import { SAFETY_SCREEN } from "./prompts";
import { SafetySchema } from "./schemas";
import { keywordFloor, maxRisk, type Risk } from "@/lib/safeguarding/keywords";

export class ScreenUnavailable extends Error {}

/**
 * spec 07 3A — screen ONE learner message before the conversation model sees it.
 * Result = max(model, keyword floor). A classifier refusal is treated as "hard": a declined
 * message is exactly the kind we must not miss (false positives are acceptable, spec 09 §5.2.6).
 * If the screen can't run, we throw rather than pass an unscreened message on.
 */
export async function screenMessage(text: string): Promise<{ risk: Risk; reason: string; source: "model" | "model+floor" | "refusal" }> {
  const floor = keywordFloor(text);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await anthropic().messages.parse({
        model: models().fast,
        max_tokens: 2048,
        system: SAFETY_SCREEN,
        messages: [{ role: "user", content: `<message>\n${text}\n</message>` }],
        output_config: { format: zodOutputFormat(SafetySchema), effort: "low" },
      });
      if (res.stop_reason === "refusal") return { risk: "hard", reason: "screen declined the message; escalated", source: "refusal" };
      const out = res.parsed_output;
      if (!out) throw new Error("safety screen returned no parsable output");
      const risk = maxRisk(out.risk, floor);
      return { risk, reason: out.reason.slice(0, 200), source: risk === out.risk ? "model" : "model+floor" };
    } catch (e) {
      lastErr = e;
      if (e instanceof Anthropic.BadRequestError || e instanceof Anthropic.AuthenticationError) break; // won't fix itself
    }
  }
  console.error("[safety] screen unavailable", lastErr);
  throw new ScreenUnavailable("safety screen unavailable");
}
