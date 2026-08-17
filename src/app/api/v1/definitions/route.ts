import { z } from "zod";
import { searchDefinitions } from "@/lib/ai/retrieval";
import { ok, badRequest, handleError } from "@/lib/api";

const schema = z.object({ term: z.string().min(2).max(100) });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = schema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return badRequest("Invalid query parameters.");
    const results = await searchDefinitions(parsed.data.term);
    return ok({ definitions: results });
  } catch (e) {
    return handleError(e);
  }
}
