/** Plain-language names for the Grade 11 verdicts, shown to learners (web and PDF). Codes stay internal. */
export const VERDICT_LABEL: Record<string, string> = {
  CONFIRM: "Your subjects fit you",
  RESCUE: "Right subjects, one at risk",
  RETHINK: "Keep them, rethink the target",
  ADJUST_ONE: "One change, not a restart",
  REDIRECT: "Time to change course",
  REDIRECT_AFTER_MATRIC: "Change direction after matric",
};
export const verdictLabel = (code: string) => VERDICT_LABEL[code] ?? code.replace(/_/g, " ").toLowerCase();
