import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, notFound, unauthorized, forbidden, handleError } from "@/lib/api";
import { newId } from "@/lib/academy";

const schema = z.object({
  lesson_id: z.string().min(1),
  seconds_spent: z.coerce.number().int().min(0).max(86400).optional()
});

/**
 * POST /api/v1/academy/progress
 * Mark a lesson complete for the caller's enrollment. The lesson must belong
 * to a certification the caller is enrolled in.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid input.");
    const { lesson_id, seconds_spent } = parsed.data;

    const db = await getDb();
    const lesson = (await db
      .prepare(
        `SELECT l.id, c.certification_id
           FROM academy_lessons l
           JOIN academy_courses c ON c.id = l.course_id
          WHERE l.id = ?`
      )
      .get(lesson_id)) as { id: string; certification_id: string } | undefined;
    if (!lesson) return notFound("Lesson not found");

    const enrollment = (await db
      .prepare("SELECT id FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
      .get(session.sub, lesson.certification_id)) as { id: string } | undefined;
    if (!enrollment) return forbidden("Enroll in this certification first.");

    await db
      .prepare(
        `INSERT INTO academy_lesson_progress (id, enrollment_id, lesson_id, completed_at, seconds_spent)
         VALUES (?, ?, ?, datetime('now'), ?)
         ON CONFLICT(enrollment_id, lesson_id)
         DO UPDATE SET completed_at = datetime('now'), seconds_spent = seconds_spent + ?`
      )
      .run(newId("prog"), enrollment.id, lesson_id, seconds_spent ?? 0, seconds_spent ?? 0);

    return ok({ completed: true, lesson_id });
  } catch (e) {
    return handleError(e);
  }
}
