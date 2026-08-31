import { getDb } from "@/lib/db";
import { ok, notFound, handleError, withCache } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const authority = (await db.prepare("SELECT * FROM authorities WHERE id = ?").get(id)) as Record<string, unknown> | undefined;
    if (!authority) return notFound("Authority not found");
    const checklist = (await db.prepare("SELECT * FROM authority_checklists WHERE authority_id = ? ORDER BY category").all(id)) as unknown[];
    return withCache(ok({ authority, checklist }), { seconds: 3600, sMaxAge: 3600 });
  } catch (e) {
    return handleError(e);
  }
}
