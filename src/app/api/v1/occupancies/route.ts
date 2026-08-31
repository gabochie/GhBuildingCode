import { getDb } from "@/lib/db";
import { ok, handleError, withCache } from "@/lib/api";

export async function GET() {
  try {
    const db = await getDb();
    const occupancies = await db.prepare("SELECT * FROM occupancies ORDER BY source_part, source_section").all();
    return withCache(ok({ occupancies, count: occupancies.length }));
  } catch (e) {
    return handleError(e);
  }
}
