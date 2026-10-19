import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CertDetailClient } from "./cert-detail-client";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ cert: string }> }): Promise<Metadata> {
  const { cert } = await params;
  const db = await getDb();
  const row = (await db.prepare("SELECT title, description FROM certifications WHERE slug = ?").get(cert)) as
    | { title: string; description: string | null }
    | undefined;
  if (!row) return { title: "Not Found" };
  return { title: row.title, description: row.description ?? undefined };
}

export default async function CertDetailPage({ params }: { params: Promise<{ cert: string }> }) {
  const { cert } = await params;
  const db = await getDb();
  const certification = (await db.prepare("SELECT * FROM certifications WHERE slug = ?").get(cert)) as
    | Record<string, unknown>
    | undefined;
  if (!certification) notFound();

  const courses = (await db
    .prepare("SELECT * FROM academy_courses WHERE certification_id = ? ORDER BY sort_order")
    .all(certification.id)) as Record<string, unknown>[];

  const lessons = (await db
    .prepare(
      `SELECT l.id, l.course_id, l.slug, l.title, l.est_minutes, l.sort_order
         FROM academy_lessons l JOIN academy_courses c ON c.id = l.course_id
        WHERE c.certification_id = ? ORDER BY c.sort_order, l.sort_order`
    )
    .all(certification.id)) as Record<string, unknown>[];

  const session = await getSession();
  let enrollment: Record<string, unknown> | null = null;
  let completedIds: string[] = [];
  let certificate: Record<string, unknown> | null = null;
  if (session) {
    enrollment =
      ((await db
        .prepare("SELECT * FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
        .get(session.sub, certification.id)) as Record<string, unknown> | undefined) ?? null;
    if (enrollment) {
      completedIds = (
        (await db
          .prepare("SELECT lesson_id FROM academy_lesson_progress WHERE enrollment_id = ?")
          .all(enrollment.id)) as { lesson_id: string }[]
      ).map((r) => r.lesson_id);
      certificate =
        ((await db
          .prepare("SELECT serial, issued_at FROM academy_certificates WHERE user_id = ? AND certification_id = ?")
          .get(session.sub, certification.id)) as Record<string, unknown> | undefined) ?? null;
    }
  }

  const lessonsByCourse: Record<string, Record<string, unknown>[]> = {};
  for (const l of lessons) {
    const cid = l.course_id as string;
    (lessonsByCourse[cid] ??= []).push(l);
  }
  const tree = courses.map((c) => ({ ...c, lessons: lessonsByCourse[c.id as string] ?? [] }));

  return (
    <CertDetailClient
      certification={JSON.parse(JSON.stringify(certification))}
      courses={JSON.parse(JSON.stringify(tree))}
      enrollment={enrollment ? JSON.parse(JSON.stringify(enrollment)) : null}
      completedIds={completedIds}
      certificate={certificate ? JSON.parse(JSON.stringify(certificate)) : null}
      authenticated={Boolean(session)}
    />
  );
}
