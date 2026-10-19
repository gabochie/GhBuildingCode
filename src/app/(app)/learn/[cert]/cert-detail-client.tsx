"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { QuizRunner } from "@/components/academy-quiz";
import { CheckCircle2, Circle, Loader2, PlayCircle, Award, Clock, ListChecks, Lock } from "lucide-react";

interface Lesson {
  id: string;
  slug: string;
  title: string;
  est_minutes: number;
}
interface Course {
  id: string;
  title: string;
  summary: string | null;
  lessons: Lesson[];
}
interface Certification {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  is_free: number;
  exam_questions: number | null;
  exam_minutes: number | null;
  exam_pass_percent: number;
}

export function CertDetailClient({
  certification,
  courses,
  enrollment,
  completedIds,
  certificate,
  authenticated
}: {
  certification: Certification;
  courses: Course[];
  enrollment: { id: string; status: string } | null;
  completedIds: string[];
  certificate: { serial: string; issued_at: string } | null;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<null | "quiz" | "exam">(null);

  const totalLessons = courses.reduce((n, c) => n + c.lessons.length, 0);
  const done = completedIds.length;
  const pct = totalLessons ? Math.round((done / totalLessons) * 100) : 0;
  const locked = !certification.is_free && !enrollment && !authenticated;

  async function enroll() {
    if (!authenticated) {
      router.push(`/sign-up?plan=professional`);
      return;
    }
    setEnrolling(true);
    setError("");
    try {
      const res = await fetch("/api/v1/academy/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certification_slug: certification.slug })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Could not enroll.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll.");
    } finally {
      setEnrolling(false);
    }
  }

  if (mode) {
    return (
      <QuizRunner
        certSlug={certification.slug}
        mode={mode}
        examMinutes={certification.exam_minutes}
        onExit={() => {
          setMode(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={certification.title} description={certification.description ?? undefined} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone="info">{certification.level}</Badge>
        {certification.is_free ? <Badge tone="success">Free</Badge> : <Badge tone="default"><Lock className="h-3 w-3" /> Paid</Badge>}
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <ListChecks className="h-3 w-3" /> {totalLessons} lessons
        </span>
        {certification.exam_questions ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> Exam: {certification.exam_questions}q · pass {certification.exam_pass_percent}%
          </span>
        ) : null}
      </div>

      {certificate && (
        <Card className="mb-6 border-success/40 bg-success/5">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-success" />
              <div>
                <p className="text-sm font-semibold">Certified</p>
                <p className="text-xs text-muted-foreground">Serial {certificate.serial}</p>
              </div>
            </div>
            <Link href={`/certificates/${certificate.serial}`} className="text-sm font-medium text-primary hover:underline">
              View certificate
            </Link>
          </CardContent>
        </Card>
      )}

      {enrollment && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{done}/{totalLessons} ({pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
            {done >= totalLessons && totalLessons > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setMode("quiz")}><PlayCircle className="h-4 w-4" /> Practice quiz</Button>
                <Button size="sm" variant="outline" onClick={() => setMode("exam")}><Award className="h-4 w-4" /> Take exam</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!enrollment && (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {locked
                ? "This is a paid certification track. Create an account and upgrade to enroll."
                : "Enroll to track your progress and unlock the exam."}
            </p>
            <Button onClick={enroll} disabled={enrolling}>
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {authenticated ? "Enroll now" : "Create account to enroll"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle className="text-base">{course.title}</CardTitle>
              {course.summary && <p className="text-sm text-muted-foreground">{course.summary}</p>}
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {course.lessons.map((lesson) => {
                  const complete = completedIds.includes(lesson.id);
                  return (
                    <li key={lesson.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link
                        href={`/learn/${certification.slug}/${lesson.slug}`}
                        className="flex min-w-0 items-center gap-2 text-sm hover:text-primary"
                      >
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">{lesson.est_minutes} min</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
