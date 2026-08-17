import { getDb } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const db = await getDb();
    const authorities = await db.prepare("SELECT * FROM authorities ORDER BY tier, name").all();
    return ok({ authorities });
  } catch (e) {
    return handleError(e);
  }
}
