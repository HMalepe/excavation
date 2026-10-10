/**
 * Norming job (spec 10 Step 9). Takes the Supabase client as a parameter so the cron route and the
 * CLI script share one implementation. Uses ONLY completed sessions from learners whose guardian
 * gave research consent (and hasn't withdrawn it), excluding quality = invalid.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeNorms, type NormResult } from "./stats";
import type { LikertResponses } from "@/lib/scoring/types";

export async function runNorming(db: SupabaseClient, grade: 9 | 11): Promise<NormResult & { version: number }> {
  const touchpoint = grade === 9 ? "G9_FOUNDATION" : "G11_CONFIRMATION";
  const { data: consents } = await db.from("guardian_consents").select("learner_id, consent_research, withdrawn_at, given_at").order("given_at", { ascending: false });
  const latest = new Map<string, { consent_research: boolean; withdrawn_at: string | null }>();
  for (const c of consents ?? []) if (!latest.has(c.learner_id)) latest.set(c.learner_id, c);
  const researchOk = new Set([...latest.entries()].filter(([, c]) => c.consent_research && !c.withdrawn_at).map(([id]) => id));

  const { data: sessions } = await db.from("sessions").select("id, learner_id, score_profiles(quality_status)").eq("touchpoint", touchpoint).eq("status", "complete");
  const eligible = (sessions ?? []).filter((s) => {
    const q = Array.isArray(s.score_profiles) ? s.score_profiles[0] : s.score_profiles;
    return researchOk.has(s.learner_id) && (q as { quality_status?: string } | null)?.quality_status !== "invalid";
  });

  const responses: LikertResponses[] = [];
  for (let i = 0; i < eligible.length; i += 200) {
    const ids = eligible.slice(i, i + 200).map((s) => s.id);
    const { data } = await db.from("item_responses").select("session_id, item_id, value").in("session_id", ids).not("value", "is", null);
    const by = new Map<string, LikertResponses>();
    for (const r of data ?? []) {
      if (r.item_id.includes(":")) continue; // per-subject G11 items aren't part of the norm scales
      const m = by.get(r.session_id) ?? {};
      m[r.item_id] = r.value;
      by.set(r.session_id, m);
    }
    responses.push(...by.values());
  }

  const result = computeNorms(responses);
  const { data: prev } = await db.from("norms").select("version").eq("grade", grade).order("version", { ascending: false }).limit(1);
  const version = (prev?.[0]?.version ?? 0) + 1;
  const { error } = await db.from("norms").insert({
    grade, version, norm_state: result.norm_state, n_sessions: result.n, percentiles: result.percentiles,
    identity_medians: result.identity_medians ?? { exploration: 50, commitment: 50 }, alphas: result.alphas, item_stats_csv: result.item_stats_csv,
  });
  if (error) throw new Error(`save norms: ${error.message}`);
  return { ...result, version };
}
