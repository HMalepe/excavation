/**
 * The Guide's hidden markers (spec 07 3B, spec 10 Step 4.5): never shown to the learner.
 *   leading tag  <<Q:7>> · <<Q:7-followup>> · <<CHECKPOINT:2>> · <<CLOSING>> · <<SAFETY>> · <<INVITE>>
 *   end markers  <<SESSION_COMPLETE>> · <<SAFETY_STOP>>
 * MarkerFilter strips them from a token stream without ever leaking a partial "<<...".
 */
export type EndMarker = "SESSION_COMPLETE" | "SAFETY_STOP";
const END: EndMarker[] = ["SESSION_COMPLETE", "SAFETY_STOP"];
const MARKER = /<<([A-Z_]+(?::[A-Za-z0-9-]+)?)>>/g;

export class MarkerFilter {
  private buf = "";
  private visible = "";
  readonly markers: string[] = [];

  /** Feed a chunk; returns text that is safe to display now. */
  feed(chunk: string): string {
    this.buf += chunk;
    let out = "";
    for (;;) {
      const start = this.buf.indexOf("<<");
      if (start === -1) {
        // Keep a trailing "<" in case it is the start of a marker split across chunks.
        const keep = this.buf.endsWith("<") ? 1 : 0;
        out += this.buf.slice(0, this.buf.length - keep);
        this.buf = this.buf.slice(this.buf.length - keep);
        break;
      }
      out += this.buf.slice(0, start);
      const end = this.buf.indexOf(">>", start);
      if (end === -1) {
        this.buf = this.buf.slice(start);
        // A "<<" that runs on too long without closing is not a marker; release it.
        if (this.buf.length > 40) { out += this.buf; this.buf = ""; }
        break;
      }
      const token = this.buf.slice(start, end + 2);
      if (/^<<[A-Z_]+(?::[A-Za-z0-9-]+)?>>$/.test(token)) this.markers.push(token.slice(2, -2));
      else out += token;
      this.buf = this.buf.slice(end + 2);
    }
    const cleaned = this.visible.length === 0 ? out.replace(/^\s+/, "") : out;
    this.visible += cleaned;
    return cleaned;
  }

  /** Flush at end of stream. */
  end(): string {
    const rest = this.buf;
    this.buf = "";
    this.visible += rest;
    return rest;
  }

  get text(): string { return this.visible.trim(); }
  get questionRef(): string | null {
    const tag = this.markers.find((m) => !END.includes(m as EndMarker));
    if (!tag) return null;
    const [kind, arg] = tag.split(":");
    if (kind === "Q") return `Q${arg}`;
    if (kind === "CHECKPOINT") return `checkpoint-${arg}`;
    return kind!.toLowerCase();
  }
  has(m: EndMarker): boolean { return this.markers.includes(m); }
}

export function stripMarkers(text: string): string {
  return text.replace(MARKER, "").trim();
}
