import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { FileDown, FileText } from "lucide-react";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const db = await getDb();
  const projects = (await db
    .prepare("SELECT id, name, readiness_score, status, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
    .all(session.sub)) as Array<Record<string, unknown>>;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate the GHBC Compliance Intelligence PDF report for a project."
      />
      {projects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No projects yet. <Link href="/projects/new" className="text-primary hover:underline">Create one</Link> to generate reports.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={String(p.id)}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="truncate">{String(p.name)}</CardTitle>
                  <Badge tone={(() => { const s = p.readiness_score as number | null; return s == null ? "default" : s >= 80 ? "success" : s >= 60 ? "warning" : "destructive"; })()}>
                    {p.readiness_score != null ? `${p.readiness_score}%` : "—"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {String(p.status)} · updated {new Date(String(p.updated_at)).toLocaleDateString()}</p>
                <Button asChild size="sm">
                  <a href={`/api/v1/projects/${p.id}/report`} target="_blank" rel="noreferrer" className="inline-block">
                    <FileDown className="h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        Reports state: “GHBC interpretation — not an official determination, and not a substitute for professional advice or a building permit.”
      </p>
    </div>
  );
}
