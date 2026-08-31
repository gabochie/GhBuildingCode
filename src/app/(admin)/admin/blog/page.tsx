import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, Badge } from "@/components/ui";
import { BlogManager } from "./manager";

export default async function AdminBlogPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const db = await getDb();
  const posts = (await db.prepare(
    "SELECT id, slug, title, excerpt, category, status, author_name, published_at, created_at, updated_at FROM blog_posts ORDER BY created_at DESC LIMIT 50"
  ).all()) as Array<{ id: string; slug: string; title: string; excerpt: string | null; category: string; status: string; author_name: string; published_at: string | null; created_at: string; updated_at: string }>;

  return (
    <div>
      <PageHeader
        title="Blog Manager"
        description="Create and manage blog articles, guides, and regulatory updates."
        actions={<Badge tone="primary">Admin</Badge>}
      />
      <BlogManager posts={posts} />
    </div>
  );
}
