import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { adminDb } from "@/lib/db/admin";
import { serverEnv } from "@/lib/env.server";
import { composeAlert } from "./alert";
import type { SchoolSettingsRow } from "@/lib/db/types";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

interface SendResult { channel: "sms" | "email"; to: string; ok: boolean; detail: string; at: string }

/** Email through Resend's REST API; without a key (dev), the message is logged instead of sent. */
async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  const env = serverEnv();
  const at = new Date().toISOString();
  if (!env.RESEND_API_KEY) { console.warn(`[safeguarding:dev] email to ${to}: ${subject}`); return { channel: "email", to, ok: true, detail: "dev-log", at }; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.SAFEGUARDING_FROM_EMAIL, to: [to], subject, text }),
    });
    return { channel: "email", to, ok: r.ok, detail: `HTTP ${r.status}`, at };
  } catch (e) { return { channel: "email", to, ok: false, detail: String(e), at }; }
}

/** SMS through a provider webhook ({to, message} + bearer token). Plug in the provider chosen for the pilot. */
async function sendSms(to: string, message: string): Promise<SendResult> {
  const env = serverEnv();
  const at = new Date().toISOString();
  if (!env.SMS_PROVIDER_URL) { console.warn(`[safeguarding:dev] sms to ${to}: ${message}`); return { channel: "sms", to, ok: true, detail: "dev-log", at }; }
  try {
    const r = await fetch(env.SMS_PROVIDER_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.SMS_PROVIDER_TOKEN ?? ""}`, "content-type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
    return { channel: "sms", to, ok: r.ok, detail: `HTTP ${r.status}`, at };
  } catch (e) { return { channel: "sms", to, ok: false, detail: String(e), at }; }
}

/**
 * Creates a hard safeguarding event and notifies the school's designated contact and backup
 * (SMS + email) and the Excavation safeguarding lead. Never throws: a notification failure must
 * not stop the learner from seeing their resources. Every attempt is logged on the event.
 */
export async function raiseHardEvent(args: { sessionId: string; learnerId: string; triggerMessageId: number | null; triggerSource: "conversation" | "scored_layer" }): Promise<string | null> {
  const db = adminDb();
  const token = randomBytes(24).toString("base64url");
  const { data: event, error } = await db.from("safeguarding_events").insert({
    session_id: args.sessionId, learner_id: args.learnerId, level: "hard", trigger_source: args.triggerSource,
    trigger_message_id: args.triggerMessageId, confirm_token_hash: sha256(token),
  }).select("id").single();
  if (error || !event) { console.error("[safeguarding] could not create event", error?.message); return null; }
  try { await notifyEvent(event.id, token); } catch (e) { console.error("[safeguarding] notify failed", e); }
  return event.id;
}

/** token = null for escalations: the lead confirms from the staff page, the school link stays valid. */
export async function notifyEvent(eventId: string, token: string | null, opts: { escalation?: boolean } = {}) {
  const db = adminDb();
  const env = serverEnv();
  const { data: ev } = await db.from("safeguarding_events").select("*, learners(first_name, last_name, current_grade, school_id), conversation_messages(content)").eq("id", eventId).single();
  if (!ev) return;
  const learner = ev.learners as { first_name: string; last_name: string; current_grade: number; school_id: string };
  const { data: settings } = await db.from("school_settings").select("*").eq("school_id", learner.school_id).single();
  const s = settings as SchoolSettingsRow | null;
  const alert = composeAlert({
    learnerName: `${learner.first_name} ${learner.last_name}`,
    grade: learner.current_grade,
    at: new Date(ev.created_at),
    level: ev.level === "hard" ? "urgent" : "soft",
    triggerMessage: (ev.conversation_messages as { content: string } | null)?.content ?? null,
    confirmUrl: token ? `${env.NEXT_PUBLIC_APP_URL}/api/safeguarding/confirm?e=${eventId}&t=${token}` : `${env.NEXT_PUBLIC_APP_URL}/staff/safeguarding`,
    timezone: s?.timezone ?? "Africa/Johannesburg",
  });

  const results: SendResult[] = [];
  if (!opts.escalation && s) {
    results.push(await sendSms(s.safeguarding_contact_phone, alert.sms));
    results.push(await sendEmail(s.safeguarding_contact_email, alert.subject, alert.body));
    results.push(await sendSms(s.safeguarding_backup_phone, alert.sms));
    if (s.safeguarding_backup_email) results.push(await sendEmail(s.safeguarding_backup_email, alert.subject, alert.body));
  }
  // The Excavation safeguarding lead is always told (spec 09 §5.1 hard path).
  const leadSubject = opts.escalation ? `[ESCALATION — school has not confirmed] ${alert.subject}` : alert.subject;
  if (env.EXCAVATION_SAFEGUARDING_LEAD_EMAIL) results.push(await sendEmail(env.EXCAVATION_SAFEGUARDING_LEAD_EMAIL, leadSubject, alert.body));
  if (env.EXCAVATION_SAFEGUARDING_LEAD_PHONE) results.push(await sendSms(env.EXCAVATION_SAFEGUARDING_LEAD_PHONE, (opts.escalation ? "ESCALATION: " : "") + alert.sms));

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { notification_log: [...((ev.notification_log as unknown[]) ?? []), ...results] };
  if (!opts.escalation && results.some((r) => r.ok && r.to !== env.EXCAVATION_SAFEGUARDING_LEAD_EMAIL && r.to !== env.EXCAVATION_SAFEGUARDING_LEAD_PHONE)) patch.school_notified_at = now;
  patch.lead_notified_at = now;
  if (opts.escalation) patch.escalated_at = now;
  await db.from("safeguarding_events").update(patch).eq("id", eventId);
}

/** The confirmation link from the alert records school_confirmed_at (spec 10 Step 7). */
export async function confirmEvent(eventId: string, token: string): Promise<boolean> {
  const db = adminDb();
  const { data: ev } = await db.from("safeguarding_events").select("id, confirm_token_hash, school_confirmed_at").eq("id", eventId).maybeSingle();
  if (!ev?.confirm_token_hash) return false;
  const a = Buffer.from(ev.confirm_token_hash, "hex"), b = Buffer.from(sha256(token), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  if (!ev.school_confirmed_at) await db.from("safeguarding_events").update({ school_confirmed_at: new Date().toISOString() }).eq("id", eventId);
  return true;
}
