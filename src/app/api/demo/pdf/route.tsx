import { handle } from "@/lib/http";
import { G9Pdf, renderPdf } from "@/lib/pdf/documents";
import { DEMO_ISSUED, DEMO_NAME, DEMO_REPORT, demoProfile } from "@/lib/demo/sample";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cached: Buffer | null = null;

/** The sample report as a PDF. Fictional data only; rendered once per server instance, then served from memory. */
export const GET = handle(async () => {
  cached ??= await renderPdf(<G9Pdf r={DEMO_REPORT} name={DEMO_NAME} profile={demoProfile()} issued={DEMO_ISSUED} />);
  return new Response(new Uint8Array(cached), { headers: { "content-type": "application/pdf", "content-disposition": 'inline; filename="excavation-sample-report.pdf"', "cache-control": "public, max-age=3600" } });
});
