"use client";

import { useCallback, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge } from "@/components/ui";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  status: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: "article", label: "Article" },
  { value: "update", label: "Update" },
  { value: "guide", label: "Guide" },
  { value: "case-study", label: "Case Study" }
];

export function PostEditor({ post, onSaved, onDeleted }: { post?: Post; onSaved: () => void; onDeleted?: () => void }) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(post?.category ?? "article");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">(post?.status === "published" ? "published" : "draft");
  const [authorName, setAuthorName] = useState(post?.author_name ?? "GHBC Team");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const autoSlug = useCallback((v: string) => {
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120));
  }, []);

  async function handleSave() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        title, slug: slug || undefined, excerpt: excerpt || undefined,
        body: body || undefined, category, tags: tags || undefined,
        cover_image: coverImage || undefined, status, author_name: authorName || undefined
      };
      const method = post ? "PUT" : "POST";
      const url = post ? `/api/v1/blog/${post.slug}` : "/api/v1/blog";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Save failed.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!post || !confirm("Delete this post permanently?")) return;
    setLoading(true);
    try {
      await fetch(`/api/v1/blog/${post.slug}`, { method: "DELETE" });
      onDeleted?.();
    } catch { /* silent */ }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{post ? "Edit Post" : "New Post"}</span>
          {post && (
            <div className="flex gap-2">
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5" /> View</Button>
              </a>
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={title} onChange={e => { setTitle(e.target.value); if (!post) autoSlug(e.target.value); }} placeholder="Post title" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
        </div>
        <div className="space-y-1.5">
          <Label>Excerpt</Label>
          <Input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary (shown in listing)" maxLength={500} />
        </div>
        <div className="space-y-1.5">
          <Label>Body</Label>
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your article content here…" className="min-h-[300px]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select value={status} onChange={e => setStatus(e.target.value as "draft" | "published")} className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Author</Label>
            <Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="GHBC Team" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Tags (comma-separated)</Label>
          <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="compliance, fire safety, permit" />
        </div>
        <div className="space-y-1.5">
          <Label>Cover image URL (optional)</Label>
          <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSave} disabled={loading || !title.trim()}>
          {loading ? "Saving…" : post ? "Update Post" : "Create Post"}
        </Button>
      </CardContent>
    </Card>
  );
}
