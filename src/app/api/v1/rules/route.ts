import { getDb } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const db = await getDb();
    const rules = await db.prepare("SELECT id, rule_id, name, description, source_reference, severity, effective_date, active FROM rules WHERE active = 1 ORDER BY rule_id").all();
    return ok({ rules });
  } catch (e) {
    return handleError(e);
  }
}
