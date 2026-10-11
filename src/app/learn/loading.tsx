/** Shown while the next step loads (the server is fetching the learner's place): never a blank screen. */
export default function Loading() {
  return (
    <div className="min-h-dvh" role="status" aria-label="Loading your next step">
      <div className="mx-auto max-w-xl space-y-6 px-4 pt-24">
        <div className="flex items-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 animate-glint rounded-full bg-accent" style={{ animationDelay: `${i * 160}ms` }} />)}
        </div>
        <div className="space-y-3" aria-hidden="true">
          <div className="h-8 w-3/4 animate-glint rounded-lg bg-sunken" />
          <div className="h-5 w-full animate-glint rounded-lg bg-sunken" />
          <div className="h-5 w-5/6 animate-glint rounded-lg bg-sunken" />
        </div>
        <p className="sr-only">Loading…</p>
      </div>
    </div>
  );
}
