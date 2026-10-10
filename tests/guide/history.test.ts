import { describe, it, expect } from "vitest";
import { toApiMessages } from "@/lib/guide/turn";
import type { MessageRow } from "@/lib/db/types";

const row = (id: number, role: MessageRow["role"], content: string): MessageRow =>
  ({ id, session_id: "s", role, content, question_ref: null, safety_risk: null, created_at: "" });

describe("Guide history → API messages", () => {
  it("starts with a user turn and keeps safety flags right after the learner message", () => {
    const m = toApiMessages([row(1, "guide", "Hey"), row(2, "learner", "hi"), row(3, "system", "safety_flag: soft")]);
    expect(m.map((x) => x.role)).toEqual(["user", "assistant", "user", "system"]);
  });
  it("never puts a system message directly after an assistant turn", () => {
    const rows = [row(1, "guide", "Hey"), row(2, "learner", "x"), row(3, "guide", "<<SAFETY>> ..."), row(4, "system", "safety_review_complete"), row(5, "learner", "I'm ok now")];
    const roles = toApiMessages(rows).map((x) => x.role);
    expect(roles).toEqual(["user", "assistant", "user", "assistant", "user", "system"]);
    for (let i = 1; i < roles.length; i++) if (roles[i] === "system") expect(roles[i - 1]).toBe("user");
  });
  it("is append-only: adding rows never changes earlier messages", () => {
    const base = [row(1, "guide", "Hey"), row(2, "learner", "a"), row(3, "guide", "b")];
    const a = toApiMessages(base);
    const b = toApiMessages([...base, row(4, "learner", "c"), row(5, "guide", "d")]);
    expect(b.slice(0, a.length)).toEqual(a);
  });
});
