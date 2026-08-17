import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { ok, badRequest, unauthorized, handleError } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { chatCompletion, aiConfigured } from "@/lib/ai/provider";

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
}

const GENERATE_SCHEMA = z.object({
  topics: z.array(z.string().min(5).max(200)).min(1).max(10),
  category: z.enum(["article", "guide", "update", "case-study"]).default("article"),
  wordCount: z.number().min(800).max(3000).default(1500)
});

const SYSTEM_PROMPT = `You are an expert content writer for GHBC (Ghana Building Compliance Intelligence), a compliance intelligence platform for the Ghana Building Code (GS 1207:2018).

Write SEO-optimised blog posts that are:
- People-first content (helpful, not written just for search engines)
- Specific to Ghana's building regulations and construction industry
- Structured with H2/H3 headings, bullet points, and short paragraphs
- 1,100-1,500 words (aim for the user's requested word count)
- Ending with a FAQ section (3-5 questions with concise answers)
- Including natural internal links to /code (Code Explorer), /compliance (Compliance Check), /copilot (AI Copilot), and /demo (Book a Demo)
- Referencing specific GS 1207:2018 parts, sections, and requirements where relevant
- Written in a professional but accessible tone
- Original analysis, not generic regurgitated content

E-E-A-T signals:
- Reference specific Code provisions (e.g., "Part 9", "Section 4.2.1")
- Include concrete data, costs, or statistics relevant to Ghana
- Demonstrate domain expertise in building compliance
- Include a brief author bio attribution to "GHBC Team"

Output JSON with this exact structure:
{
  "title": "SEO-friendly title (under 60 chars ideally)",
  "excerpt": "One-paragraph summary (under 160 chars for meta description)",
  "metaDescription": "SEO meta description (150-160 chars)",
  "body": "Full article body in markdown-ish plain text with ## and ### headings, bullet points, numbered lists",
  "tags": ["tag1", "tag2", "tag3"],
  "faq": [{"q": "Question?", "a": "Answer"}]
}`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "admin") return unauthorized("Admin access required.");

  if (!aiConfigured()) {
    return badRequest("AI provider not configured. Set AI_API_KEY in your .env file.");
  }

  try {
    const parsed = GENERATE_SCHEMA.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid payload. Provide topics (array), optional category, optional wordCount.");

    const { topics, category, wordCount } = parsed.data;
    const db = getDb();
    const results: Array<{ slug: string; title: string; status: string }> = [];

    for (const topic of topics) {
      const userPrompt = `Write a ${wordCount}-word blog post about: "${topic}"

Category: ${category}
Target audience: Architects, engineers, developers, and building control professionals in Ghana.
Focus on GS 1207:2018 compliance and practical value.`;

      const response = await chatCompletion(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        { temperature: 0.4, maxTokens: 4000, json: true }
      );

      let article: {
        title: string;
        excerpt: string;
        metaDescription: string;
        body: string;
        tags: string[];
        faq: Array<{ q: string; a: string }>;
      };

      try {
        article = JSON.parse(response.content);
      } catch {
        // If JSON parse fails, try to extract JSON from the response
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          results.push({ slug: "parse-error", title: topic, status: "error" });
          continue;
        }
        article = JSON.parse(jsonMatch[0]);
      }

      const slug = slugify(article.title);
      const existing = db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(slug);
      if (existing) {
        results.push({ slug, title: article.title, status: "exists" });
        continue;
      }

      // Append FAQ section to body
      let body = article.body;
      if (article.faq && article.faq.length > 0) {
        body += "\n\n## Frequently Asked Questions\n\n";
        for (const faq of article.faq) {
          body += `### ${faq.q}\n\n${faq.a}\n\n`;
        }
      }

      const id = uid("post");
      const tagsJson = JSON.stringify(article.tags || []);

      db.prepare(
        `INSERT INTO blog_posts (id, slug, title, excerpt, body, cover_image, category, tags, status, author_name, author_bio, meta_description, author_user_id, published_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 'draft', 'GHBC Team', 'The GHBC editorial team produces research-backed content on Ghana building regulations, construction compliance, and digital building control.', ?, NULL, ?, ?, ?)`
      ).run(id, slug, article.title, article.excerpt || null, body, category, tagsJson, article.metaDescription || article.excerpt || null, now(), now());

      results.push({ slug, title: article.title, status: "draft" });
    }

    return ok({
      generated: results.filter(r => r.status === "draft").length,
      skipped: results.filter(r => r.status === "exists").length,
      errors: results.filter(r => r.status === "error").length,
      posts: results
    });
  } catch (e) {
    return handleError(e);
  }
}
