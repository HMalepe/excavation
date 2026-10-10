import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireAnthropicKey, serverEnv } from "@/lib/env.server";

let client: Anthropic | null = null;

/** Server-only Anthropic client. Every AI call goes through a server route (spec 10, "Before you start"). */
export function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: requireAnthropicKey(), maxRetries: 2 });
  return client;
}

/**
 * Model tiers (spec 07 §1): a fast model for the per-message safety screen (A); a strong model for
 * the conversation, signals and reports (B–F) and the summaries (G–H). Override by env.
 */
export function models() {
  const env = serverEnv();
  return { fast: env.AI_MODEL_FAST, strong: env.AI_MODEL_STRONG };
}

/**
 * Server-side refusal fallback on the strong model: if a safety classifier declines (e.g. a learner
 * writing honestly about something hard), the API re-runs the same request on a fallback model
 * inside the same call instead of dead-ending. "default" routes by refusal category.
 */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;
export const strongExtras = { betas: [FALLBACK_BETA], fallbacks: "default" as const };
