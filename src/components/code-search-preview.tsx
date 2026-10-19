"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, ArrowRight, FileText } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";

type Requirement = {
  id?: string;
  title?: string;
  part?: number | string;
  section?: string;
  text?: string;
  snippet?: string;
};

export function CodeSearchPreview() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Requirement[] | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}&limit=3`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Search failed.");
      setResults(json?.data?.requirements ?? []);
      trackEvent("cta_sandbox_search");
    } catch (err) {
      setResults(null);
      setError(err instanceof Error ? err.message : "Search failed. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-8">
      <h2 className="text-lg font-bold tracking-tight sm:text-xl">Try it now — search the Ghana Building Code</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        No account needed for a first look. Results show requirement summaries — sign up free for full citations.
      </p>

      <form onSubmit={onSearch} className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. fire escape width, setback, accessibility…"
            aria-label="Search the Ghana Building Code"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || q.trim().length < 2}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>
      )}

      {results && (
        <div className="mt-4 space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches for &ldquo;{q}&rdquo;. Try a broader term.</p>
          ) : (
            results.map((r, i) => (
              <div key={r.id ?? i} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.title || (r.text ?? "").slice(0, 90) || "Requirement"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.part != null ? `Part ${r.part}` : ""}
                      {r.section ? ` · ${r.section}` : ""}
                      {r.snippet ? ` — ${r.snippet.slice(0, 120)}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <p className="pt-1 text-center text-sm text-muted-foreground">
            <Link href="/register" className="font-medium text-primary hover:underline" onClick={() => trackEvent("cta_sandbox_register")}>
              Create a free account <ArrowRight className="inline h-3.5 w-3.5" /> for full citations, compliance checks and projects
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
