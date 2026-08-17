import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

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

function extractFaq(body: string): Array<{ q: string; a: string }> {
  const faq: Array<{ q: string; a: string }> = [];
  const faqMatch = body.match(/## Frequently Asked Questions[\s\S]*$/);
  if (!faqMatch) return faq;

  const section = faqMatch[0];
  const items = section.split(/### /).slice(1);
  for (const item of items) {
    const lines = item.trim().split("\n");
    const q = lines[0]?.replace(/^#+\s*/, "").trim();
    const a = lines.slice(1).join("\n").trim();
    if (q && a) faq.push({ q, a });
  }
  return faq;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const post = db.prepare("SELECT title, excerpt, meta_description, cover_image, published_at, updated_at FROM blog_posts WHERE slug = ? AND status = 'published'").get(slug) as { title: string; excerpt: string; meta_description: string | null; cover_image: string | null; published_at: string | null; updated_at: string | null } | undefined;
  if (!post) return { title: "Not Found" };

  const description = post.meta_description || post.excerpt || undefined;
  const url = `${APP_URL}/blog/${slug}`;
  const ogImage = post.cover_image || `${APP_URL}/blog/og/${slug}`;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: "GHBC",
      type: "article",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage]
    }
  };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const row = db.prepare("SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'").get(slug) as Record<string, unknown> | undefined;
  if (!row) notFound();

  const title = String(row.title);
  const excerpt = row.excerpt ? String(row.excerpt) : null;
  const category = String(row.category);
  const authorName = String(row.author_name);
  const authorBio = row.author_bio ? String(row.author_bio) : null;
  const body = String(row.body);
  const coverImage = row.cover_image ? String(row.cover_image) : null;
  const tagsRaw = row.tags ? String(row.tags) : null;
  const tags = tagsRaw && tagsRaw !== "[]"
    ? (tagsRaw.startsWith("[") ? JSON.parse(tagsRaw) as string[] : tagsRaw.split(",").map(t => t.trim()).filter(Boolean))
    : null;
  const publishedAt = row.published_at ? String(row.published_at) : null;
  const updatedAt = row.updated_at ? String(row.updated_at) : null;
  const published = publishedAt ? new Date(publishedAt) : null;
  const url = `${APP_URL}/blog/${slug}`;

  const faq = extractFaq(body);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    author: { "@type": "Organization", name: authorName, url: APP_URL },
    publisher: { "@type": "Organization", name: "GHBC", url: APP_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    ...(coverImage ? { image: coverImage } : {}),
    ...(tags ? { keywords: tags.join(", ") } : {})
  };

  const faqSchema = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a }
    }))
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article>
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Badge tone={CATEGORY_TONE[category] ?? "default"}>
                {CATEGORIES[category] ?? category}
              </Badge>
              {published && (
                <time className="text-sm text-muted-foreground" dateTime={publishedAt!}>
                  {published.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </time>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            {excerpt && <p className="mt-3 text-lg text-muted-foreground">{excerpt}</p>}
            <p className="mt-2 text-sm text-muted-foreground">By {authorName}</p>
            {authorBio && <p className="mt-1 text-xs text-muted-foreground italic">{authorBio}</p>}
          </div>

          {coverImage && (
            <img src={coverImage} alt={title} className="mb-8 w-full rounded-xl object-cover" style={{ maxHeight: 400 }} />
          )}

          <div className="prose prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {body}
          </div>

          {tags && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
              {tags.map((tag: string) => (
                <span key={tag} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </article>
      </main>
    </>
  );
}
