"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { Search } from "lucide-react";

interface SearchResult {
  requirement_id: string;
  source_text: string;
  source_document: string;
  part: string;
  section: string;
  clause: string;
  requirement_type: string;
  editorial_state: string;
}

export function CodeSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}&limit=12`);
      const json = await res.json();
      setResults((json.data?.requirements ?? []) as SearchResult[]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      <form onSubmit={run} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the Ghana Building Code — e.g. stair riser, exit travel distance, sprinkler…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
      </form>

      {results && (
        <Card className="mt-4">
          <CardContent className="pt-5">
            <p className="mb-3 text-sm font-medium">{results.length} result{results.length === 1 ? "" : "s"}</p>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requirements matched. Try different keywords.</p>
            ) : (
              <ul className="space-y-3">
                {results.map((r) => (
                  <li key={r.requirement_id} className="rounded-lg border border-border p-3">
                    <Link href={`/code/${r.part}#${r.clause}`} className="group">
                      <p className="text-sm font-medium group-hover:text-primary">
                        {r.source_document} P{r.part} {r.section ? `§${r.section}` : ""} — {r.clause}
                      </p>
                      <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{r.source_text}</p>
                      <p className="mt-1 text-xs">
                        <span className="text-primary">{r.requirement_type}</span> · {r.editorial_state}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
