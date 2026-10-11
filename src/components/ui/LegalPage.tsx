import Link from "next/link";
import { PlainPage } from "./PlainPage";
import { LEGAL_UPDATED, legalApproved, type LegalDoc } from "@/lib/legal/content";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <PlainPage width="md" centered={false}>
      <Link href="/" className="btn-quiet self-start !px-0 no-underline">← Back</Link>
      <h1 className="text-[2rem] sm:text-4xl">{doc.title}</h1>
      {!legalApproved() && <p role="status" className="alert">Draft. This page is waiting for review by our attorney.</p>}
      <p className="text-lg text-muted">{doc.intro}</p>
      <p className="text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
      {doc.sections.map((s) => (
        <section key={s.heading} className="space-y-2">
          <h2 className="text-2xl">{s.heading}</h2>
          {s.body.map((p, i) => <p key={i} className="text-lg leading-relaxed">{p}</p>)}
        </section>
      ))}
      <nav className="flex flex-wrap gap-4 border-t border-line pt-4 text-sm" aria-label="Legal pages">
        <Link href="/privacy">Privacy notice</Link><Link href="/terms">Terms of use</Link><Link href="/cookies">Cookies</Link><a href="mailto:privacy@theexcavation.co.za">privacy@theexcavation.co.za</a>
      </nav>
    </PlainPage>
  );
}
