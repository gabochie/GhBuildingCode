import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/academy`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${APP_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${APP_URL}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${APP_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 }
  ];

  // Dynamic blog pages
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const db = await getDb();
    const posts = (await db.prepare(
      "SELECT slug, updated_at FROM blog_posts WHERE status = 'published'"
    ).all()) as Array<{ slug: string; updated_at: string }>;

    blogPages = posts.map((post) => ({
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: post.updated_at || now,
      changeFrequency: "monthly" as const,
      priority: 0.8
    }));
  } catch {
    // DB not ready yet — return static pages only
  }

  return [...staticPages, ...blogPages];
}
