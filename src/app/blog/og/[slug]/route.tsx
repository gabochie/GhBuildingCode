import { ImageResponse } from "next/og";
import { getDb } from "@/lib/db";

const CATEGORY_COLORS: Record<string, string> = {
  article: "#171717",
  update: "#0ea5e9",
  guide: "#8b5cf6",
  "case-study": "#16a34a"
};

const CATEGORY_LABELS: Record<string, string> = {
  article: "Article",
  update: "Update",
  guide: "Guide",
  "case-study": "Case Study"
};

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const post = db.prepare(
    "SELECT title, category, author_name, published_at FROM blog_posts WHERE slug = ? AND status = 'published'"
  ).get(slug) as { title: string; category: string; author_name: string; published_at: string | null } | undefined;

  if (!post) {
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: "#171717", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontSize: 32 }}>GHBC</span>
      </div>,
      { width: 1200, height: 630 }
    );
  }

  const accent = CATEGORY_COLORS[post.category] || "#171717";
  const label = CATEGORY_LABELS[post.category] || post.category;
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, background: "#09090b", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 60px 0" }}>
        <span style={{ color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>GHBC</span>
        <span style={{ color: accent, fontSize: 16, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, background: "rgba(255,255,255,0.1)", padding: "6px 16px", borderRadius: 6 }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px" }}>
        <div style={{ width: 80, height: 4, background: accent, borderRadius: 2, marginBottom: 32 }} />
        <div style={{ color: "#fff", fontSize: 52, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1.5, maxWidth: 900 }}>
          {post.title.length > 80 ? post.title.slice(0, 77) + "..." : post.title}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 60px 40px" }}>
        <span style={{ color: "#a1a1aa", fontSize: 18 }}>By {post.author_name}</span>
        <span style={{ color: "#a1a1aa", fontSize: 18 }}>{date}</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}
