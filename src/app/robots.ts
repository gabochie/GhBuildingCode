import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard", "/projects", "/account", "/upgrade"]
      }
    ],
    sitemap: `${APP_URL}/sitemap.xml`
  };
}
