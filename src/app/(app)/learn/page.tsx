import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { GraduationCap, Clock, ListChecks, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "Study the Ghana Building Code (GS 1207:2018) and earn source-backed certifications. Free core track; professional tracks for compliance, permits and fire safety."
};

interface CertRow {
  id: string;
  slug: string;
  title: string;
  level: string;
  description: string | null;
  is_free: number;
  exam_questions: number | null;
  exam_minutes: number | null;
  course_count: number;
}

const LEVEL_TONE: Record<string, "info" | "primary" | "success" | "warning"> = {
  foundation: "info",
  professional: "primary",
  specialist: "warning"
};

export default async function LearnCatalogPage() {
  const db = await getDb();
  const certs = (await db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.level, c.description, c.is_free,
              c.exam_questions, c.exam_minutes,
              (SELECT COUNT(*) FROM academy_courses ac WHERE ac.certification_id = c.id) AS course_count
         FROM certifications c ORDER BY c.sort_order`
    )
    .all()) as unknown as CertRow[];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Academy"
        description="Study GS 1207:2018 as structured, sourced lessons and prove competence with a verified certificate."
      />

      <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Every lesson states the exact clause and page it comes from. Questions are drawn only
          from verified extractions of the Code, so you always study the actual text.
        </p>
      </div>

      {certs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Academy content is being prepared. Check back soon.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {certs.map((c) => (
          <Card key={c.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <CardTitle className="text-base">{c.title}</CardTitle>
              {c.is_free ? (
                <Badge tone="success">Free</Badge>
              ) : (
                <Badge tone="default">
                  <Lock className="h-3 w-3" /> Paid
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={LEVEL_TONE[c.level] ?? "default"}>{c.level}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ListChecks className="h-3 w-3" /> {c.course_count} modules
                </span>
                {c.exam_questions ? (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {c.exam_questions}q
                    {c.exam_minutes ? ` · ${c.exam_minutes} min` : ""}
                  </span>
                ) : null}
              </div>
              {c.description && (
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{c.description}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/learn/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {c.is_free ? "Start learning" : "View track"}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
