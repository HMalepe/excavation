import { DESCENT, type Descent as D } from "@/lib/flow/stages";

/** The five-stage descent (spec 02 §3.7). Named stages only — never a percentage. */
export function Descent({ at }: { at: D }) {
  const idx = DESCENT.indexOf(at);
  return (
    <nav aria-label="How deep you are" className="flex items-center gap-1.5">
      {DESCENT.map((name, i) => (
        <span key={name} className="flex items-center gap-1.5">
          <span
            aria-current={i === idx ? "step" : undefined}
            className={`h-2 rounded-full ${i < idx ? "w-4 bg-amber/60" : i === idx ? "w-6 bg-amber" : "w-4 bg-ink-3"}`}
          />
        </span>
      ))}
      <span className="ml-2 text-xs uppercase tracking-widest text-muted">{at}</span>
    </nav>
  );
}
