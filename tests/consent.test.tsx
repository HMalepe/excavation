import { describe, it, expect } from "vitest";
import { consentStatus, summarise, validateConsentInput, type ConsentRow } from "@/lib/consent/records";
import { parseConsentCsv } from "@/lib/school/csv";
import { CONSENT_BLOCKS, CONSENT_CHOICES, CONSENT_FORM_VERSION } from "@/lib/consent/form";
import { ConsentFormPdf } from "@/lib/pdf/consent";
import { renderPdf } from "@/lib/pdf/documents";

const row = (o: Partial<ConsentRow> = {}): ConsentRow => ({ learner_id: "l1", guardian_name: "N M", relationship: "mother", consent_service: true, consent_ai_crossborder: true, consent_wellbeing: true, consent_research: false, form_version: CONSENT_FORM_VERSION, given_at: "2026-10-02T08:00:00Z", withdrawn_at: null, evidence_ref: null, ...o });

describe("consent register", () => {
  it("clears a learner only with all three required consents and no withdrawal", () => {
    expect(consentStatus([]).status).toBe("missing");
    expect(consentStatus([row()]).status).toBe("on_file");
    expect(consentStatus([row({ consent_wellbeing: false })]).status).toBe("missing");
    expect(consentStatus([row({ withdrawn_at: "2026-10-05T00:00:00Z" })]).status).toBe("withdrawn");
  });
  it("uses the newest active record, so a re-consent after withdrawal clears the learner", () => {
    const rows = [row({ given_at: "2026-10-01T00:00:00Z", withdrawn_at: "2026-10-03T00:00:00Z" }), row({ given_at: "2026-10-06T00:00:00Z" })];
    expect(consentStatus(rows).status).toBe("on_file");
  });
  it("optional research consent never affects clearance", () => {
    expect(consentStatus([row({ consent_research: false })]).status).toBe("on_file");
  });
  it("validates a new record", () => {
    expect(validateConsentInput({ guardian_name: "N", relationship: "m", consent_research: false })).toHaveLength(2);
    expect(validateConsentInput({ guardian_name: "Nomsa M", relationship: "mother", consent_research: false, given_on: "2999-01-01" })[0]).toMatch(/future/);
    expect(validateConsentInput({ guardian_name: "Nomsa M", relationship: "mother", consent_research: true, given_on: "2026-10-02" })).toEqual([]);
  });
  it("summarises counts", () => {
    expect(summarise(["on_file", "on_file", "missing", "withdrawn"])).toMatchObject({ total: 4, onFile: 2, missing: 1, withdrawn: 1 });
  });
});

describe("consent CSV and form", () => {
  it("parses a school's typed-up forms and reports bad lines", () => {
    const { rows, errors } = parseConsentCsv("learner_ref,guardian_name,relationship,research,form_ref,date\n1001,Nomsa Mokoena,mother,yes,box 3,2026-10-02\n1002,,aunt,no,,\n");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ learner_ref: "1001", consent_research: true, evidence_ref: "box 3" });
    expect(errors[0]).toMatch(/line 3.*guardian_name/);
  });
  it("has the three required consents plus an optional one that doesn't block", () => {
    expect(CONSENT_CHOICES.filter((c) => c.required).map((c) => c.key)).toEqual(["consent_service", "consent_ai_crossborder", "consent_wellbeing"]);
    expect(CONSENT_CHOICES.find((c) => c.key === "consent_research")!.required).toBe(false);
    expect(CONSENT_BLOCKS.map((b) => b.heading)).toContain("Your rights");
  });
  it("renders one pre-filled page per learner, draft until approved", async () => {
    const buf = await renderPdf(<ConsentFormPdf approved={false} learners={[{ name: "Lerato M.", grade: 9, school: "Pilot School" }, { name: "Sipho K.", grade: 9, school: "Pilot School" }]} />);
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(3000);
  }, 30_000);
});
