import { StrataRule } from "@/components/ui/Brand";

/** Shown while the next step loads (the server is fetching the learner's place): never a blank screen. */
export default function Loading() {
  return (
    <div className="min-h-dvh" role="status" aria-label="Loading your next step">
      <StrataRule />
      <div className="mx-auto max-w-xl space-y-6 px-4 pt-24">
        <div className="flex items-end gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => <span key={i} className="animate-glint w-5 rounded-md border-[1.5px] border-edge" style={{ height: 12 + i * 5, background: `var(--strata-${i})`, animationDelay: `${i * 140}ms` }} />)}
        </div>
        <div className="space-y-3" aria-hidden="true">
          <div className="h-9 w-3/4 animate-glint rounded-lg bg-sunken" />
          <div className="h-5 w-full animate-glint rounded-lg bg-sunken" />
          <div className="h-5 w-5/6 animate-glint rounded-lg bg-sunken" />
        </div>
        <p className="sr-only">Loading…</p>
      </div>
    </div>
  );
}
