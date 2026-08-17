import { getDb } from "@/lib/db";
import { ok, notFound, handleError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ partNo: string }> }) {
  try {
    const { partNo } = await params;
    const db = getDb();
    const part = db.prepare("SELECT * FROM parts WHERE part_no = ?").get(Number(partNo)) as
      | Record<string, unknown>
      | undefined;
    if (!part) return notFound("Part not found");

    const sections = db
      .prepare(
        `SELECT s.id, s.section_no, s.title, COUNT(c.id) AS clause_count
         FROM sections s LEFT JOIN clauses c ON c.section_id = s.id
         WHERE s.part_id = ? GROUP BY s.id ORDER BY CAST(s.section_no AS REAL)`
      )
      .all(part.id) as Array<Record<string, unknown>>;

    return ok({ part, sections });
  } catch (e) {
    return handleError(e);
  }
}
