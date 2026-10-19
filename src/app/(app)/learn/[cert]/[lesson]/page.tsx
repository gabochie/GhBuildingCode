import Link from "next/link";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/markdown";
import { LessonCompleteButton } from "./lesson-complete";
import { getSession } from "@/lib/auth/session";
import { ArrowLeft, FileText } from "lucide-react";

export default async function LessonPage({ params }: { params: Promise<{ cert: string; lesson: string }> }) {
  const { cert, lesson } = await params;
  const db = await getDb();

  const certRow = (await db.prepare("SELECT id, slug, title FROM certifications WHERE slug = ?").get(cert)) as
    | { id: string; slug: string; title: string }
    | undefined;
  if (!certRow) notFound();

  const lessonRow = (await db
    .prepare(
      `SELECT l.* FROM academy_lessons l JOIN academy_courses c ON c.id = l.course_id
        WHERE c.certification_id = ? AND l.slug = ?`
    )
    .get(certRow.id, lesson)) as Record<string, unknown> | undefined;
  if (!lessonRow) notFound();

  const clauseIds = lessonRow.source_clauses_json ? (JSON.parse(String(lessonRow.source_clauses_json)) as string[]) : [];
  const pages = lessonRow.source_pages_json ? (JSON.parse(String(lessonRow.source_pages_json)) as number[]) : [];

  const session = await getSession();
  let enrolled = false;
  let complete = false;
  if (session) {
    const enr = (await db
      .prepare("SELECT id FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
      .get(session.sub, certRow.id)) as { id: string } | undefined;
    if (enr) {
      enrolled = true;
      const p = (await db
        .prepare("SELECT completed_at FROM academy_lesson_progress WHERE enrollment_id = ? AND lesson_id = ?")
        .get(enr.id, lessonRow.id)) as { completed_at: string | null } | undefined;
      complete = Boolean(p?.completed_at);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/learn/${cert}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {certRow.title}
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">{String(lessonRow.title)}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>{Number(lessonRow.est_minutes)} min read</span>
        {pages.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3" /> GS 1207 pages {pages.join(", ")}
          </span>
        )}
        {clauseIds.length > 0 && <span>{clauseIds.length} source clauses</span>}
      </div>

      <article className="mt-6 rounded-xl border border-border bg-card p-6">
        {lessonRow.body_md ? (
          <Markdown source={String(lessonRow.body_md)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This lesson has not been populated with source text yet. Its clauses are listed below.
          </p>
        )}
      </article>

      {clauseIds.length > 0 && (
        <details className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
          <summary className="cursor-pointer font-medium">Source clause references</summary>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {clauseIds.slice(0, 50).map((id) => (
              <li key={id} className="font-mono">{id}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-8 flex items-center justify-between">
        {enrolled ? (
          <LessonCompleteButton lessonId={String(lessonRow.id)} initialComplete={complete} />
        ) : (
          <Link href={`/learn/${cert}`} className="text-sm font-medium text-primary hover:underline">
            Enroll to track your progress
          </Link>
        )}
      </div>
    </div>
  );
}
