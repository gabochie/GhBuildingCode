import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const db = getDb();
    const conversations = db
      .prepare("SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50")
      .all(session.sub) as unknown[];
    return ok({ conversations });
  } catch (e) {
    return handleError(e);
  }
}
