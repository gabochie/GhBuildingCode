import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, handleError } from "@/lib/api";
import { withCache } from "@/lib/api";

/**
 * GET /api/v1/academy/catalog
 * Public list of certifications with course counts and (when signed in) the
 * caller's enrollment/progress. Answers are never included here.
 */
export async function GET() {
  try {
    const db = await getDb();
    const certs = (await db
      .prepare(
        `SELECT c.id, c.slug, c.title, c.level, c.description, c.price_ghs_minor,
                c.is_free, c.prerequisite_slug, c.exam_questions, c.exam_minutes,
                c.exam_pass_percent, c.sort_order,
                (SELECT COUNT(*) FROM academy_courses ac WHERE ac.certification_id = c.id) AS course_count
           FROM certifications c
          ORDER BY c.sort_order`
      )
      .all()) as Record<string, unknown>[];

    const session = await getSession();
    let enrollments: Record<string, unknown>[] = [];
    if (session) {
      enrollments = (await db
        .prepare("SELECT certification_id, status, enrolled_at, completed_at FROM academy_enrollments WHERE user_id = ?")
        .all(session.sub)) as Record<string, unknown>[];
    }
    const byCert = Object.fromEntries(enrollments.map((e) => [e.certification_id as string, e]));
    const withState = certs.map((c) => ({ ...c, enrollment: byCert[c.id as string] ?? null }));

    const res = ok({ certifications: withState, authenticated: Boolean(session) });
    return session ? res : withCache(res, { seconds: 300 });
  } catch (e) {
    return handleError(e);
  }
}
