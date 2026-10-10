import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-10 px-5 py-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-amber">The Excavation</p>
        <h1 className="text-4xl leading-tight">Know Thy Self measures.<br />The Excavation interprets.</h1>
        <p className="text-muted">A self-discovery tool for choosing subjects in Grade 9, and checking them in Grade 11.</p>
      </header>
      <nav className="grid gap-3">
        <Link href="/login" className="btn-primary">I&apos;m a learner</Link>
        <Link href="/staff/login" className="btn-ghost">School or Excavation staff</Link>
      </nav>
      <p className="text-xs text-muted">This is not a test, and there are no wrong answers. Results are reflective insights, not a diagnosis.</p>
    </main>
  );
}
