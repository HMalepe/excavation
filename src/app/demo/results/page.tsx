import { G9Report } from "@/components/report/ReportViews";
import { DEMO_ISSUED, DEMO_NAME, DEMO_REPORT, demoProfile } from "@/lib/demo/sample";

export const metadata = { title: "Demo · Final results" };

export default function DemoResults() {
  return (
    <div className="space-y-4">
      <div className="note flex flex-wrap items-center justify-between gap-3 text-sm">
        <p><strong>Sample report for a fictional learner.</strong> This is what a Grade 9 learner receives after a human reviewer has read it.</p>
        <a href="/api/demo/pdf" className="btn-ghost !min-h-11 !px-4 no-underline">Download the PDF</a>
      </div>
      <div>
        <G9Report r={DEMO_REPORT} profile={demoProfile()} name={DEMO_NAME} issued={DEMO_ISSUED} />
      </div>
    </div>
  );
}
