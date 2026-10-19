import { randomUUID, createHash } from "node:crypto";
import { getDb } from "@/lib/db";

/**
 * Academy domain helpers shared by the API routes and learner pages.
 * Mirrors docs/ACADEMY_PLAN.md §4/§9. All content is generated from the
 * GS 1207:2018 corpus and carries clause/requirement provenance.
 */

export interface Certification {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  price_ghs_minor: string;
  is_free: number;
  prerequisite_slug: string | null;
  exam_questions: number | null;
  exam_minutes: number | null;
  exam_pass_percent: number;
}

export interface Course {
  id: string;
  certification_id: string;
  slug: string;
  title: string;
  summary: string | null;
  part_no: number | null;
  sort_order: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  body_md: string | null;
  est_minutes: number;
  source_clauses_json: string | null;
  source_pages_json: string | null;
  sort_order: number;
}

/** Deterministic serial + verification hash for a certificate. */
export function certificateProof(userId: string, certSlug: string, issuedAt: string) {
  const proof = createHash("sha256")
    .update(`GHBC|${userId}|${certSlug}|${issuedAt}`)
    .digest("hex");
  const serial = `GHBC-${new Date(issuedAt).getUTCFullYear()}-${proof.slice(0, 10).toUpperCase()}`;
  return { serial, verifyHash: proof };
}

/** Score a set of {questionId, choiceIndex} answers against the DB. */
export async function scoreAnswers(
  answers: { question_id: string; choice_index: number }[]
): Promise<{ score: number; total: number; results: { question_id: string; correct_index: number; explanation: string | null; correct: boolean }[] }> {
  const db = await getDb();
  const results: { question_id: string; correct_index: number; explanation: string | null; correct: boolean }[] = [];
  let score = 0;
  for (const a of answers) {
    const row = (await db
      .prepare("SELECT correct_index, explanation FROM academy_questions WHERE id = ?")
      .get(a.question_id)) as { correct_index: number; explanation: string | null } | undefined;
    if (!row) continue;
    const correct = row.correct_index === a.choice_index;
    if (correct) score++;
    results.push({
      question_id: a.question_id,
      correct_index: row.correct_index,
      explanation: row.explanation,
      correct
    });
  }
  return { score, total: answers.length, results };
}

/** Fetch exam-eligible questions for a certification, deterministic-random. */
export async function pickExamQuestions(certId: string, count: number) {
  const db = await getDb();
  const rows = (await db
    .prepare(
      `SELECT q.id, q.prompt, q.options_json, q.kind, q.part_no, q.clause_id, q.page
         FROM academy_questions q
         JOIN academy_lessons l ON l.id = q.lesson_id
         JOIN academy_courses c ON c.id = l.course_id
        WHERE c.certification_id = ? AND q.is_exam_eligible = 1
        ORDER BY RANDOM() LIMIT ?`
    )
    .all(certId, count)) as {
    id: string;
    prompt: string;
    options_json: string;
    kind: string;
    part_no: number | null;
    clause_id: string | null;
    page: number | null;
  }[];

  // Fallback: questions not yet bound to a lesson but exam-eligible.
  if (rows.length < count) {
    const extra = (await db
      .prepare(
        `SELECT id, prompt, options_json, kind, part_no, clause_id, page
           FROM academy_questions
          WHERE is_exam_eligible = 1 AND lesson_id IS NULL
          ORDER BY RANDOM() LIMIT ?`
      )
      .all(count - rows.length)) as typeof rows;
    rows.push(...extra);
  }
  return rows;
}

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
