import resources from "@config/safeguarding_resources.json";

/** Crisis resources from config (spec 09 §5.3), tap-to-call on phones. */
export function Resources({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-2" : "space-y-3"}>
      {resources.resources.map((r) => (
        <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-[14px] border-[1.5px] border-line bg-surface px-4 py-3">
          <span className="font-display font-bold">{r.name}</span>
          <span className="flex gap-3">
            <a href={`tel:${r.tel}`} className="font-display text-lg font-bold">{r.contact}</a>
            {"sms" in r && r.sms ? <a href={`sms:${r.sms}`}>SMS {r.sms}</a> : null}
          </span>
          <span className="w-full text-xs text-muted">{r.hours}{"note" in r && r.note ? ` · ${r.note}` : ""}</span>
        </li>
      ))}
    </ul>
  );
}
