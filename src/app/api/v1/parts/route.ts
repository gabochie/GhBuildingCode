import { getDb } from "@/lib/db";
import { ok, handleError, withCache } from "@/lib/api";

export async function GET() {
  try {
    const db = await getDb();
    const parts = (await db
      .prepare("SELECT part_no, title FROM parts ORDER BY part_no")
      .all()) as Array<{ part_no: number; title: string }>;
    return withCache(ok({ parts, count: parts.length }));
  } catch (e) {
    return handleError(e);
  }
}
