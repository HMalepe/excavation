/** "Doors open / doors closed" strip for a subject option card (spec 08 Part 7). */
export function Doors({ open, closed }: { open: string[]; closed: string[] }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded-xl border border-ok/40 bg-ok/10 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-ok">Keeps open</p>
        <p className="text-sm">{open.length ? open.join(" · ") : "—"}</p>
      </div>
      <div className="rounded-xl border border-danger/40 bg-danger/10 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-danger">Closes</p>
        <p className="text-sm">{closed.length ? closed.join(" · ") : "Nothing major"}</p>
      </div>
    </div>
  );
}
