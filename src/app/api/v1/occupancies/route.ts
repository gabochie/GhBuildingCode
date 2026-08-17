import { getDb } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const db = getDb();
    const occupancies = db.prepare("SELECT * FROM occupancies ORDER BY source_part, source_section").all();
    return ok({ occupancies, count: occupancies.length });
  } catch (e) {
    return handleError(e);
  }
}
