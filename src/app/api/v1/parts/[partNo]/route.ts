import { getDb } from "@/lib/db";
import { ok, notFound, handleError, withCache } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: Promise<{ partNo: string }> }) {
  try {
    const { partNo } = await params;
    const db = await getDb();
    const part = (await db.prepare("SELECT * FROM parts WHERE part_no = ?").get(Number(partNo))) as
      | Record<string, unknown>
      | undefined;
    if (!part) return notFound("Part not found");

    const sections = (await db
      .prepare(
        `SELECT s.id, s.section_no, s.title, COUNT(c.id) AS clause_count
         FROM sections s LEFT JOIN clauses c ON c.section_id = s.id
         WHERE s.part_id = ? GROUP BY s.id ORDER BY CAST(s.section_no AS REAL)`
      )
      .all(part.id)) as Array<Record<string, unknown>>;

    return withCache(ok({ part, sections }), { seconds: 3600, sMaxAge: 3600 });
  } catch (e) {
    return handleError(e);
  }
}
