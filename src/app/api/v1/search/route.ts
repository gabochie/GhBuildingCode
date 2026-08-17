import { z } from "zod";
import { getDb, now, uid } from "@/lib/db";
import { searchChunks, searchDefinitions, searchRequirements } from "@/lib/ai/retrieval";
import { ok, badRequest, handleError } from "@/lib/api";

const schema = z.object({
  q: z.string().min(2).max(300),
  part: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return badRequest("Invalid query parameters.");
    const { q, part, limit } = parsed.data;

    const requirements = searchRequirements({ query: q, part: part ?? null, limit });
    const chunks = searchChunks(q, { part: part ?? undefined, limit: 5 });
    const definitions = searchDefinitions(q);

    const db = getDb();
    db.prepare("INSERT INTO search_stats (id, query, hits, source, created_at) VALUES (?, ?, ?, ?, ?)").run(
      uid("ss"),
      q,
      requirements.length,
      "api",
      now()
    );

    return ok({ query: q, requirements, chunks, definitions, count: requirements.length });
  } catch (e) {
    return handleError(e);
  }
}
