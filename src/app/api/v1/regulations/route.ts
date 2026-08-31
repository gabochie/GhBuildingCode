import { getDb } from "@/lib/db";
import { ok, handleError, withCache } from "@/lib/api";

export async function GET() {
  try {
    const db = await getDb();
    const regulations = await db.prepare("SELECT * FROM regulations").all();
    return withCache(ok({ regulations }));
  } catch (e) {
    return handleError(e);
  }
}
