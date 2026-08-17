import { getDb } from "@/lib/db";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function GET() {
  const db = await getDb();
  const posts = (await db.prepare(
    "SELECT slug, title, excerpt, body, author_name, published_at, updated_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 20"
  ).all()) as Array<{
    slug: string; title: string; excerpt: string | null;
    body: string; author_name: string; published_at: string | null; updated_at: string | null;
  }>;

  const items = posts.map(post => {
    const url = `${APP_URL}/blog/${post.slug}`;
    const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();
    const modDate = post.updated_at ? new Date(post.updated_at).toUTCString() : pubDate;
    const description = post.excerpt || post.body.slice(0, 300).replace(/\n/g, " ") + "…";

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(description)}</description>
      <dc:creator>${escapeXml(post.author_name)}</dc:creator>
      <pubDate>${pubDate}</pubDate>
      <lastBuildDate>${modDate}</lastBuildDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GHBC Blog — Ghana Building Compliance Intelligence</title>
    <link>${APP_URL}/blog</link>
    <description>Compliance insights, regulatory updates, and practical guides for the Ghana Building Code (GS 1207:2018).</description>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${APP_URL}/blog/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
