import Link from "next/link";
import { PlainPage } from "@/components/ui/PlainPage";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <PlainPage>
      <p className="eyebrow">404</p>
      <h1 className="text-[2rem] sm:text-4xl">We can&apos;t find that page.</h1>
      <p className="text-lg text-muted">The link might be old or mistyped. If your teacher gave you the link, ask them for a new one.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/login" className="btn-primary">Learner login</Link>
        <Link href="/" className="btn-ghost">Back to the start</Link>
      </div>
    </PlainPage>
  );
}
