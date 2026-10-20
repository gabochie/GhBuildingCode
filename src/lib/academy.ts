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

/**
 * Fetch questions for a certification, deterministic-random.
 *
 * Questions are keyed by their source `clause_id` (a clause can appear in
 * lessons across more than one certification, so `lesson_id`/`course_id` are
 * not authoritative). A question belongs to a certification when its clause
 * appears in the `source_clauses_json` of any of that certification's lessons.
 *
 * @param examOnly when true, restrict to exam-eligible items (exam mode);
 *   practice quizzes draw from the full set.
 */
export async function pickExamQuestions(certId: string, count: number, examOnly = true) {
  const db = await getDb();
  const rows = (await db
    .prepare(
      `SELECT q.id, q.prompt, q.options_json, q.kind, q.part_no, q.clause_id, q.page
         FROM academy_questions q
        WHERE ${examOnly ? "q.is_exam_eligible = 1 AND " : ""}q.clause_id IS NOT NULL
          AND EXISTS (
                SELECT 1
                  FROM academy_lessons l
                  JOIN academy_courses c ON c.id = l.course_id
                 WHERE c.certification_id = ?
                   AND instr(l.source_clauses_json, '"' || q.clause_id || '"') > 0
              )
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

  return rows;
}

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
