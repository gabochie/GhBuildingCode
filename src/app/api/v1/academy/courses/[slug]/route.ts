import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, notFound, handleError } from "@/lib/api";

/**
 * GET /api/v1/academy/courses/[slug]
 * A certification's full course/lesson tree with the caller's per-lesson
 * progress (when signed in and enrolled). Lesson bodies are included.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = await getDb();
    const cert = (await db
      .prepare("SELECT * FROM certifications WHERE slug = ?")
      .get(slug)) as Record<string, unknown> | undefined;
    if (!cert) return notFound("Certification not found");

    const courses = (await db
      .prepare("SELECT * FROM academy_courses WHERE certification_id = ? ORDER BY sort_order")
      .all(cert.id)) as Record<string, unknown>[];

    const lessons = (await db
      .prepare(
        `SELECT l.* FROM academy_lessons l
           JOIN academy_courses c ON c.id = l.course_id
          WHERE c.certification_id = ?
          ORDER BY c.sort_order, l.sort_order`
      )
      .all(cert.id)) as Record<string, unknown>[];

    const lessonsByCourse: Record<string, unknown[]> = {};
    for (const l of lessons) {
      const cid = l.course_id as string;
      (lessonsByCourse[cid] ??= []).push(l);
    }
    const tree = courses.map((c) => ({ ...c, lessons: lessonsByCourse[c.id as string] ?? [] }));

    const session = await getSession();
    let enrollment: Record<string, unknown> | null = null;
    let progress: Record<string, unknown>[] = [];
    if (session) {
      enrollment =
        ((await db
          .prepare("SELECT * FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
          .get(session.sub, cert.id)) as Record<string, unknown> | undefined) ?? null;
      if (enrollment) {
        progress = (await db
          .prepare("SELECT lesson_id, completed_at FROM academy_lesson_progress WHERE enrollment_id = ?")
          .all(enrollment.id)) as Record<string, unknown>[];
      }
    }
    const completed = new Set(progress.map((p) => p.lesson_id as string));

    const treeWithProgress = tree.map((c) => ({
      ...c,
      lessons: (c.lessons as Record<string, unknown>[]).map((l) => ({
        ...l,
        completed: completed.has(l.id as string)
      }))
    }));

    return ok({ certification: cert, courses: treeWithProgress, enrollment });
  } catch (e) {
    return handleError(e);
  }
}
