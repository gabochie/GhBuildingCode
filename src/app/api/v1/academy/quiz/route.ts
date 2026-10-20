import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, notFound, unauthorized, forbidden, handleError } from "@/lib/api";
import { certificateProof, newId, pickExamQuestions, scoreAnswers } from "@/lib/academy";

const getSchema = z.object({
  cert: z.string().min(1).max(80),
  mode: z.enum(["quiz", "exam"]).default("quiz"),
  count: z.coerce.number().int().min(1).max(100).default(10)
});

const postSchema = z.object({
  cert: z.string().min(1).max(80),
  mode: z.enum(["quiz", "exam"]).default("quiz"),
  answers: z
    .array(z.object({ question_id: z.string().min(1), choice_index: z.coerce.number().int().min(0).max(9) }))
    .min(1)
    .max(100)
});

/**
 * GET /api/v1/academy/quiz — serve questions WITHOUT the answer key.
 * Exam mode is restricted to exam-eligible items and the cert's exam size.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const url = new URL(req.url);
    const parsed = getSchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) return badRequest("Invalid query parameters.");
    const { cert: certSlug, mode, count } = parsed.data;

    const db = await getDb();
    const cert = (await db
      .prepare("SELECT id, slug, exam_questions, exam_minutes, exam_pass_percent FROM certifications WHERE slug = ?")
      .get(certSlug)) as
      | { id: string; slug: string; exam_questions: number | null; exam_minutes: number | null; exam_pass_percent: number }
      | undefined;
    if (!cert) return notFound("Certification not found");

    const desired = mode === "exam" ? cert.exam_questions ?? count : count;
    const rows = await pickExamQuestions(cert.id, desired, mode === "exam");

    const questions = rows.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: JSON.parse(q.options_json) as string[],
      kind: q.kind,
      part_no: q.part_no,
      clause_id: q.clause_id,
      page: q.page
    }));

    return ok({
      mode,
      certification: { slug: cert.slug, exam_minutes: cert.exam_minutes, exam_pass_percent: cert.exam_pass_percent },
      count: questions.length,
      questions
    });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/v1/academy/quiz — grade answers; on a passing exam, issue a
 * certificate and mark the enrollment complete.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid input.");
    const { cert: certSlug, mode, answers } = parsed.data;

    const db = await getDb();
    const cert = (await db
      .prepare("SELECT id, slug, title, exam_questions, exam_pass_percent FROM certifications WHERE slug = ?")
      .get(certSlug)) as
      | { id: string; slug: string; title: string; exam_questions: number | null; exam_pass_percent: number }
      | undefined;
    if (!cert) return notFound("Certification not found");

    const enrollment = (await db
      .prepare("SELECT id FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
      .get(session.sub, cert.id)) as { id: string } | undefined;
    if (!enrollment) return forbidden("Enroll in this certification first.");

    const { score, total, results } = await scoreAnswers(answers);
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percent >= cert.exam_pass_percent;

    await db
      .prepare(
        `INSERT INTO academy_quiz_attempts
           (id, user_id, enrollment_id, certification_id, mode, score, total, passed, answers_json, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        newId("att"),
        session.sub,
        enrollment.id,
        cert.id,
        mode,
        score,
        total,
        passed ? 1 : 0,
        JSON.stringify(answers)
      );

    let certificate: { serial: string; verify_hash: string; issued_at: string } | null = null;
    if (mode === "exam" && passed) {
      const issuedAt = new Date().toISOString();
      const { serial, verifyHash } = certificateProof(session.sub, cert.slug, issuedAt);
      const existing = (await db
        .prepare("SELECT serial FROM academy_certificates WHERE user_id = ? AND certification_id = ?")
        .get(session.sub, cert.id)) as { serial: string } | undefined;
      if (!existing) {
        await db
          .prepare(
            `INSERT INTO academy_certificates
               (id, user_id, certification_id, serial, recipient_name, issued_at, verify_hash)
             VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`
          )
          .run(newId("cert"), session.sub, cert.id, serial, session.name || "GHBC Certificate Holder", verifyHash);
        await db
          .prepare("UPDATE academy_enrollments SET status = 'completed', completed_at = datetime('now') WHERE id = ?")
          .run(enrollment.id);
      }
      const row = (await db
        .prepare("SELECT serial, verify_hash, issued_at FROM academy_certificates WHERE user_id = ? AND certification_id = ?")
        .get(session.sub, cert.id)) as { serial: string; verify_hash: string; issued_at: string } | undefined;
      certificate = row ?? null;
    }

    return ok({
      score,
      total,
      percent,
      pass_percent: cert.exam_pass_percent,
      passed,
      results,
      certificate
    });
  } catch (e) {
    return handleError(e);
  }
}
