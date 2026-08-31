"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Input, Label, Badge } from "@/components/ui";

interface GeneratedPost {
  slug: string;
  title: string;
  status: "draft" | "exists" | "error";
}

interface DraftPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function ContentPipeline() {
  const [topicsText, setTopicsText] = useState("");
  const [category, setCategory] = useState<string>("article");
  const [wordCount, setWordCount] = useState(1500);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedPost[] | null>(null);
  const [error, setError] = useState("");

  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const res = await fetch("/api/v1/blog?status=draft&limit=50");
      const json = await res.json();
      setDrafts(json.data?.posts || []);
    } catch { /* ignore */ }
    setLoadingDrafts(false);
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  async function handleGenerate() {
    const topics = topicsText.split("\n").map(t => t.trim()).filter(Boolean);
    if (topics.length === 0) { setError("Enter at least one topic."); return; }

    setGenerating(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/v1/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics, category, wordCount })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Generation failed.");
      setResults(json.data.posts);
      setTopicsText("");
      fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    }
    setGenerating(false);
  }

  async function handlePublish(slug: string) {
    setPublishing(slug);
    try {
      await fetch(`/api/v1/blog/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" })
      });
      fetchDrafts();
    } catch { /* ignore */ }
    setPublishing(null);
  }

  async function handleDelete(slug: string) {
    if (!confirm("Delete this draft?")) return;
    try {
      await fetch(`/api/v1/blog/${slug}`, { method: "DELETE" });
      fetchDrafts();
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-8">
      {/* Generation Form */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="topics">Topics (one per line, up to 10)</Label>
            <textarea
              id="topics"
              rows={5}
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              value={topicsText}
              onChange={(e) => setTopicsText(e.target.value)}
              placeholder={"Fire safety requirements for high-rise buildings in Ghana\nAccessibility compliance under GS 1207:2018 Part 10\nHow to prepare for a building permit inspection"}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="article">Article</option>
                <option value="guide">Guide</option>
                <option value="update">Update</option>
                <option value="case-study">Case Study</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wordCount">Target words</Label>
              <Input
                id="wordCount"
                type="number"
                min={800}
                max={3000}
                step={100}
                className="w-24"
                value={wordCount}
                onChange={(e) => setWordCount(parseInt(e.target.value) || 1500)}
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? "Generating…" : `Generate ${topicsText.split("\n").filter(t => t.trim()).length || 1} post(s)`}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Each topic generates a 1,100–1,500 word SEO-optimised blog post with H2/H3 headings, FAQ section, internal links to your site features, and GS 1207:2018 references. All posts save as <strong>drafts</strong> for your review.
          </p>
          <p className="text-xs text-muted-foreground">
            Requires <code className="rounded bg-muted px-1 py-0.5">AI_API_KEY</code> in your <code className="rounded bg-muted px-1 py-0.5">.env</code> file.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Generation Results */}
      {results && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold">Generation Complete</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="text-success">{results.filter(r => r.status === "draft").length} created</span>
            <span className="text-muted-foreground">{results.filter(r => r.status === "exists").length} skipped (duplicate)</span>
            <span className="text-destructive">{results.filter(r => r.status === "error").length} errors</span>
          </div>
          <div className="mt-3 space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge tone={r.status === "draft" ? "success" : r.status === "exists" ? "default" : "destructive"}>
                  {r.status}
                </Badge>
                <span className="truncate">{r.title}</span>
                {r.status === "draft" && (
                  <Link href={`/blog/${r.slug}`} target="_blank" className="ml-auto text-primary hover:underline">preview →</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft Queue */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Draft Queue</h2>
          <Button variant="ghost" size="sm" onClick={fetchDrafts} disabled={loadingDrafts}>
            {loadingDrafts ? "Loading…" : "Refresh"}
          </Button>
        </div>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No drafts. Generate some posts above.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {drafts.map((post) => (
              <div key={post.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="default">{post.category}</Badge>
                    <h3 className="truncate text-sm font-semibold">{post.title}</h3>
                  </div>
                  {post.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Created {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="outline" size="sm">Preview</Button>
                  </Link>
                  <Link href={`/admin/blog`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handlePublish(post.slug)}
                    disabled={publishing === post.slug}
                  >
                    {publishing === post.slug ? "Publishing…" : "Publish"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(post.slug)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
