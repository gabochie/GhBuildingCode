"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Award, CheckCircle2, Loader2, XCircle, ArrowLeft } from "lucide-react";

interface Question {
  id: string;
  prompt: string;
  options: string[];
  kind: string;
  part_no: number | null;
  clause_id: string | null;
  page: number | null;
}

interface GradedResult {
  question_id: string;
  correct_index: number;
  explanation: string | null;
  correct: boolean;
}

interface GradeResponse {
  score: number;
  total: number;
  percent: number;
  pass_percent: number;
  passed: boolean;
  results: GradedResult[];
  certificate: { serial: string; issued_at: string } | null;
}

/**
 * Serves questions without the answer key, then grades a submission. In `exam`
 * mode it runs against the certification's exam size and issues a certificate
 * on a pass.
 */
export function QuizRunner({
  certSlug,
  mode,
  examMinutes,
  onExit
}: {
  certSlug: string;
  mode: "quiz" | "exam";
  examMinutes: number | null;
  onExit: () => void;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [grade, setGrade] = useState<GradeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/v1/academy/quiz?cert=${encodeURIComponent(certSlug)}&mode=${mode}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.data?.error || "Could not load questions.");
        if (cancelled) return;
        setQuestions(json.data.questions ?? []);
        if (mode === "exam" && examMinutes) setSecondsLeft(examMinutes * 60);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load questions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [certSlug, mode, examMinutes]);

  async function submit() {
    if (!questions || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const answers = questions.map((q) => ({ question_id: q.id, choice_index: choices[q.id] ?? -1 }));
      const res = await fetch("/api/v1/academy/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cert: certSlug, mode, answers })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Could not submit.");
      setGrade(json.data as GradeResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (secondsLeft === null || grade) return;
    if (secondsLeft <= 0) {
      if (!submittedRef.current) {
        submittedRef.current = true;
        submit();
      }
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, grade]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error && !questions) {
    return (
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <p className="mt-6 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const answered = Object.keys(choices).length;
  const total = questions?.length ?? 0;

  if (total === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No questions are available for this track yet. New questions are added from verified
            extractions of the Code — please check back soon.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (grade) {
    const resultsById = new Map(grade.results.map((r) => [r.question_id, r]));
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title={mode === "exam" ? "Exam result" : "Quiz result"} description={grade.passed ? "You passed." : "Keep studying and try again."} />

        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            {grade.passed ? <Award className="h-10 w-10 text-success" /> : <XCircle className="h-10 w-10 text-destructive" />}
            <p className="text-3xl font-extrabold">{grade.percent}%</p>
            <p className="text-sm text-muted-foreground">
              {grade.score} of {grade.total} correct · pass mark {grade.pass_percent}%
            </p>
            {grade.certificate && (
              <div className="mt-3 rounded-lg border border-success/40 bg-success/5 px-4 py-3">
                <p className="text-sm font-semibold text-success">Certificate issued</p>
                <Link href={`/certificates/${grade.certificate.serial}`} className="text-sm text-primary hover:underline">
                  {grade.certificate.serial}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions?.map((q, idx) => {
            const r = resultsById.get(q.id);
            return (
              <Card key={q.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-2">
                    {r?.correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{idx + 1}. {q.prompt}</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {q.options.map((opt, i) => {
                          const isCorrect = r?.correct_index === i;
                          const isChosen = choices[q.id] === i;
                          return (
                            <li
                              key={i}
                              className={
                                isCorrect
                                  ? "rounded border border-success/40 bg-success/5 px-2 py-1 text-success"
                                  : isChosen
                                    ? "rounded border border-destructive/40 bg-destructive/5 px-2 py-1 text-destructive"
                                    : "px-2 py-1 text-muted-foreground"
                              }
                            >
                              {opt}
                            </li>
                          );
                        })}
                      </ul>
                      {r?.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground">{r.explanation}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex gap-3">
          <Button onClick={onExit}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}><ArrowLeft className="h-4 w-4" /> Exit</Button>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{answered}/{total} answered</span>
          {secondsLeft !== null && (
            <Badge tone={secondsLeft < 60 ? "warning" : "info"}>
              {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {questions?.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {idx + 1}. {q.prompt}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const selected = choices[q.id] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setChoices((c) => ({ ...c, [q.id]: i }))}
                      className={
                        "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors " +
                        (selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted")
                      }
                    >
                      <span className={"grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs " + (selected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {q.clause_id && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Part {q.part_no} · {q.clause_id}{q.page ? ` · p.${q.page}` : ""}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-8 flex justify-end">
        <Button onClick={submit} disabled={submitting || answered === 0}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "exam" ? "Submit exam" : "Check answers"}
        </Button>
      </div>
    </div>
  );
}
