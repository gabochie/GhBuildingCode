import { getDb } from "@/lib/db";
import { ok, notFound, handleError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const req = (await db.prepare("SELECT * FROM requirements WHERE requirement_id = ? OR id = ?").get(id, id)) as
      | Record<string, unknown>
      | undefined;
    if (!req) return notFound("Requirement not found");
    const conditions = (await db.prepare("SELECT * FROM requirement_conditions WHERE requirement_id = ?").all(req.id)) as unknown[];
    const citations = (await db
      .prepare("SELECT * FROM source_citations WHERE requirement_id = ?")
      .all(req.requirement_id)) as unknown[];
    return ok({ requirement: { ...req, conditions }, citations });
  } catch (e) {
    return handleError(e);
  }
}
