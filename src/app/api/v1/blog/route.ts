import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, handleError } from "@/lib/api";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(120).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  cover_image: z.string().max(500).optional(),
  category: z.enum(["article", "update", "guide", "case-study"]).default("article"),
  tags: z.string().max(300).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  author_name: z.string().max(100).optional()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 100);

    const db = getDb();
    let query = "SELECT id, slug, title, excerpt, category, tags, status, author_name, published_at, created_at, updated_at FROM blog_posts";
    const conditions: string[] = [];
    const params: string[] = [];

    if (status) {
      if (status !== "published") {
        const session = await getSession();
        if (!session || session.role !== "admin") return unauthorized("Admin access required to view drafts.");
      }
      conditions.push("status = ?"); params.push(status);
    } else { conditions.push("status = 'published'"); }
    if (category) { conditions.push("category = ?"); params.push(category); }

    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY published_at DESC, created_at DESC LIMIT ?";
    params.push(String(limit));

    const posts = db.prepare(query).all(...params);
    return ok({ posts });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "admin") return unauthorized("Admin access required.");

  try {
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid post payload.");

    const data = parsed.data;
    const slug = data.slug || slugify(data.title);
    const db = getDb();

    const existing = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(slug);
    if (existing) return badRequest("A post with this slug already exists.");

    const id = uid("post");
    const publishedAt = data.status === "published" ? now() : null;
    const tagsJson = data.tags
      ? (data.tags.startsWith("[") ? data.tags : JSON.stringify(data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)))
      : "[]";

    db.prepare(
      `INSERT INTO blog_posts (id, slug, title, excerpt, body, cover_image, category, tags, status, author_name, author_user_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, slug, data.title, data.excerpt ?? null, data.body,
      data.cover_image ?? null, data.category, tagsJson,
      data.status, data.author_name || "GHBC Team", session.sub, publishedAt
    );

    return ok({ id, slug });
  } catch (e) {
    return handleError(e);
  }
}
