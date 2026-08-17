import { z } from "zod";
import { getDb } from "@/lib/db";
import { searchRequirements } from "@/lib/ai/retrieval";
import { ok, badRequest, handleError } from "@/lib/api";

const schema = z.object({
  query: z.string().optional(),
  part: z.coerce.number().int().optional(),
  type: z.string().optional(),
  occupancy: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  verified_only: z.coerce.boolean().optional()
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return badRequest("Invalid query parameters.");
    const { query, part, type, occupancy, limit, verified_only } = parsed.data;

    const types = type ? type.split(",").map((t) => t.trim()).filter(Boolean) : null;
    const q = query || occupancy || "";

    const db = getDb();
    let rows;
    if (q) {
      rows = searchRequirements({
        query: q,
        part: part ?? null,
        types,
        limit,
        verifiedOnly: verified_only
      });
    } else {
      let sql = "SELECT * FROM requirements WHERE 1=1";
      const params: unknown[] = [];
      if (part) { sql += " AND part = ?"; params.push(part); }
      if (types?.length) { sql += ` AND requirement_type IN (${types.map(() => "?").join(",")})`; params.push(...types); }
      if (verified_only) { sql += " AND editorial_state = 'VERIFIED'"; }
      sql += " ORDER BY confidence DESC LIMIT ?";
      params.push(limit);
      rows = db.prepare(sql).all(...params);
    }

    return ok({ requirements: rows, count: rows.length });
  } catch (e) {
    return handleError(e);
  }
}
