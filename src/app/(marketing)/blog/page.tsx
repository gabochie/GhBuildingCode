import { getDb } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Blog",
  alternates: { types: { "application/rss+xml": [{ title: "GHBC Blog RSS", url: `${APP_URL}/blog/feed.xml` }] } }
};

const CATEGORIES: Record<string, string> = {
  article: "Article",
  update: "Update",
  guide: "Guide",
  "case-study": "Case Study"
};

const CATEGORY_TONE: Record<string, "default" | "primary" | "info" | "success"> = {
  article: "default",
  update: "info",
  guide: "primary",
  "case-study": "success"
};

export default async function BlogListPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const db = await getDb();

  let query = "SELECT id, slug, title, excerpt, category, tags, author_name, published_at FROM blog_posts WHERE status = 'published'";
  const args: string[] = [];

  if (category) { query += " AND category = ?"; args.push(category); }
  query += " ORDER BY published_at DESC LIMIT 50";

  const posts = (await db.prepare(query).all(...args)) as Array<{ id: string; slug: string; title: string; excerpt: string | null; category: string; tags: string; author_name: string; published_at: string | null }>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Blog</h1>
        <p className="mt-2 text-muted-foreground">
          Compliance insights, regulatory updates, and practical guides for the Ghana Building Code.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/blog">
            <Badge tone={!category ? "primary" : "default"} className="cursor-pointer">{!category ? "All" : "All"}</Badge>
          </Link>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <Link key={key} href={`/blog?category=${key}`}>
              <Badge tone={category === key ? "primary" : "default"} className="cursor-pointer">{label}</Badge>
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {posts.map((p) => (
            <Link key={String(p.id)} href={`/blog/${String(p.slug)}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge tone={CATEGORY_TONE[String(p.category)] ?? "default"}>
                      {CATEGORIES[String(p.category)] ?? String(p.category)}
                    </Badge>
                    {p.published_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(String(p.published_at)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-2 line-clamp-2 text-base">{String(p.title)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{String(p.excerpt || "")}</p>
                  <p className="mt-3 text-xs text-muted-foreground">By {String(p.author_name)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
