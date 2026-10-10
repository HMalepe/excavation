import { DESCENT, type Descent as D } from "@/lib/flow/stages";

/**
 * The five-stage descent (spec 02 §3.7) as a core sample: one block per earth layer.
 * Named stages only — never a percentage.
 */
export function Descent({ at }: { at: D }) {
  const idx = DESCENT.indexOf(at);
  return (
    <nav aria-label={`How deep you are: ${at}, stage ${idx + 1} of ${DESCENT.length}`} className="flex items-center gap-2.5">
      <ol className="flex items-end gap-1" aria-hidden="true">
        {DESCENT.map((name, i) => (
          <li key={name}
            className={`w-4 rounded-[4px] border-[1.5px] transition-all ${i === idx ? "h-5 border-edge" : "h-3"} ${i < idx ? "border-transparent" : i > idx ? "border-dashed border-line" : ""}`}
            style={{ background: i > idx ? "transparent" : `var(--strata-${i + 1})`, boxShadow: i === idx ? "2px 2px 0 var(--shadow)" : undefined }} />
        ))}
      </ol>
      <span className="font-display text-[0.7rem] font-bold uppercase leading-tight tracking-[0.14em] text-muted">
        <span className="hidden sm:inline">Depth · </span>{at}
      </span>
    </nav>
  );
}
