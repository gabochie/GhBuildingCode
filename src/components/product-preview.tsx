import { Check, AlertTriangle, Quote, ShieldCheck, ArrowRight } from "lucide-react";

/**
 * Static, CSS-only product mock — shows what GHBC output looks like without
 * screenshots or real user data. Decorative: marked aria-hidden.
 */
export function ProductPreview() {
  return (
    <div aria-hidden="true" className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Compliance check — Office, Accra
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>Fire means of egress — GS 1207 Part 3 <span className="text-muted-foreground">· met</span></span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>Accessibility — GS 1207 Part 9 <span className="text-muted-foreground">· met</span></span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>Setback from boundary — <span className="font-medium">gap found</span></span>
          </li>
        </ul>
        <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          Gap detail: 0.8 m provided vs 1.2 m required for this assembly. Cited to Part 3, Section 3.4.
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Quote className="h-3.5 w-3.5 text-primary" /> Source-backed answer
        </div>
        <p className="mt-3 text-sm">
          &ldquo;Every GHBC finding traces to its controlled regulatory source — document, part,
          section, clause and page — so you can verify it yourself.&rdquo;
        </p>
        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>GS 1207:2018 — Ghana Building Code</p>
          <p>Part 3 · Means of Egress · Clause 3.4.2 · Page 3-14</p>
          <p className="flex items-center gap-1 pt-1 font-medium text-foreground">
            Verified citation <ArrowRight className="h-3 w-3" />
          </p>
        </div>
      </div>
    </div>
  );
}
