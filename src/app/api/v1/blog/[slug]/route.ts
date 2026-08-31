import { z } from "zod";
import { getDb, now } from "@/lib/db";
import { ok, badRequest, notFound, handleError, requireAdmin } from "@/lib/api";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(120).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  cover_image: z.string().max(500).optional(),
  category: z.enum(["article", "update", "guide", "case-study"]).optional(),
  tags: z.string().max(300).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  author_name: z.string().max(100).optional()
});

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = await getDb();
    const post = (await db.prepare(
      "SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'"
    ).get(slug)) as Record<string, unknown> | undefined;

    if (!post) return notFound("Post not found.");
    return ok({ post });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug: currentSlug } = await params;
    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid post payload.");

    const db = await getDb();
    const existing = (await db.prepare("SELECT id, slug FROM blog_posts WHERE slug = ?").get(currentSlug)) as { id: string; slug: string } | undefined;
    if (!existing) return notFound("Post not found.");

    const data = parsed.data;
    const newSlug = data.slug || (data.title ? slugify(data.title) : currentSlug);

    if (newSlug !== currentSlug) {
      const dup = await db.prepare("SELECT id FROM blog_posts WHERE slug = ? AND id != ?").get(newSlug, existing.id);
      if (dup) return badRequest("A post with this slug already exists.");
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      if (key === "slug") { fields.push("slug = ?"); values.push(newSlug); }
      else if (key === "tags") {
        const tagsStr = String(val);
        const tagsJson = tagsStr.startsWith("[") ? tagsStr : JSON.stringify(tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean));
        fields.push("tags = ?"); values.push(tagsJson);
      }
      else if (key === "status" && val === "published") {
        fields.push("status = ?", "published_at = COALESCE(published_at, ?)");
        values.push(val, now());
      }
      else { fields.push(`${key} = ?`); values.push(val); }
    }
    fields.push("updated_at = ?"); values.push(now());
    values.push(existing.id);

    if (fields.length > 1) {
      await db.prepare(`UPDATE blog_posts SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    return ok({ slug: newSlug });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireAdmin();
    const { slug } = await params;
    const db = await getDb();
    const result = (await db.prepare("DELETE FROM blog_posts WHERE slug = ?").run(slug)) as { changes: number };
    if (result.changes === 0) return notFound("Post not found.");
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
