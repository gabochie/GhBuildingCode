import { getDb } from "@/lib/db";
import { ok, handleError } from "@/lib/api";

export async function GET() {
  try {
    const db = getDb();
    const regulations = db.prepare("SELECT * FROM regulations").all();
    return ok({ regulations });
  } catch (e) {
    return handleError(e);
  }
}
