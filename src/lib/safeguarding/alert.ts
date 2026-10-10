/**
 * spec 09 §5.1 / spec 10 Step 7: the hard-path alert. Pure composer so the content rule is testable:
 * ONLY learner name, grade, time, level and the trigger message. No other session content.
 */
export interface AlertInput {
  learnerName: string;
  grade: number;
  at: Date;
  level: "urgent" | "soft";
  triggerMessage: string | null;
  confirmUrl: string;
  timezone: string;
}

export function composeAlert(a: AlertInput) {
  const when = new Intl.DateTimeFormat("en-ZA", { timeZone: a.timezone, dateStyle: "medium", timeStyle: "short" }).format(a.at);
  const trigger = a.triggerMessage ? a.triggerMessage.slice(0, 600) : "(raised by the questionnaire, no message)";
  const subject = `[The Excavation] ${a.level === "urgent" ? "URGENT " : ""}safeguarding alert — ${a.learnerName}, Grade ${a.grade}`;
  const body = [
    `Learner: ${a.learnerName}`,
    `Grade: ${a.grade}`,
    `Time: ${when}`,
    `Level: ${a.level}`,
    `Message that triggered this: "${trigger}"`,
    "",
    "The learner has been shown crisis resources and told that a trusted adult at school will be let know.",
    `Please confirm you have received this: ${a.confirmUrl}`,
  ].join("\n");
  return { subject, body };
}

/**
 * Has the alert gone unconfirmed for 4 SCHOOL hours (spec 09 §5.2.3)? Counts only time inside the
 * school day on weekdays, in the school's timezone. Pure.
 */
export function schoolHoursElapsed(from: Date, to: Date, dayStart: string, dayEnd: string, timezone: string): number {
  const [sh, sm] = dayStart.split(":").map(Number) as [number, number];
  const [eh, em] = dayEnd.split(":").map(Number) as [number, number];
  const startMin = sh * 60 + sm, endMin = eh * 60 + em;
  let minutes = 0;
  // Walk in 5-minute steps: simple, timezone-correct, and fast enough for a few days' span.
  const step = 5 * 60_000;
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let t = from.getTime(); t < to.getTime(); t += step) {
    const parts = Object.fromEntries(fmt.formatToParts(new Date(t)).map((p) => [p.type, p.value]));
    if (parts.weekday === "Sat" || parts.weekday === "Sun") continue;
    const m = Number(parts.hour) * 60 + Number(parts.minute);
    if (m >= startMin && m < endMin) minutes += Math.min(5, (to.getTime() - t) / 60_000);
  }
  return minutes / 60;
}

export const ESCALATE_AFTER_SCHOOL_HOURS = 4;
