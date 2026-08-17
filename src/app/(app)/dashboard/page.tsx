import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { FolderKanban, ShieldAlert, FileWarning, Clock3, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();
  const db = getDb();

  const projects = db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 8")
    .all(session!.sub) as Array<Record<string, unknown>>;

  const issues = db
    .prepare(
      "SELECT COUNT(*) c FROM compliance_findings f JOIN projects p ON p.id = f.project_id WHERE p.user_id = ? AND f.severity IN ('CRITICAL','HIGH')"
    )
    .get(session!.sub) as { c: number };
  const docs = db
    .prepare("SELECT COUNT(*) c FROM documents WHERE user_id = ?")
    .get(session!.sub) as { c: number };
  const lastReview = db
    .prepare("SELECT MAX(updated_at) m FROM projects WHERE user_id = ? AND status = 'reviewed'")
    .get(session!.sub) as { m: string | null };

  const scoreTone = (s: number | null) => {
    if (s == null) return "default";
    if (s >= 80) return "success";
    if (s >= 60) return "warning";
    return "destructive";
  };

  return (
    <div>
      <PageHeader
        title={`Welcome back${session?.name ? `, ${session.name.split(" ")[0]}` : ""}`}
        description="Ghana Building Compliance Intelligence — understand requirements, check your project, find what's missing."
        actions={
          <Link href="/projects/new">
            <Button>Check My Project <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <FolderKanban className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{projects.length}</p>
            <p className="text-xs text-muted-foreground">Active compliance projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Open Issues</CardTitle>
            <ShieldAlert className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{issues.c}</p>
            <p className="text-xs text-muted-foreground">CRITICAL / HIGH findings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Documents</CardTitle>
            <FileWarning className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{docs.c}</p>
            <p className="text-xs text-muted-foreground">Uploaded to your workspace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Last Review</CardTitle>
            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lastReview.m ? new Date(lastReview.m).toLocaleDateString() : "—"}</p>
            <p className="text-xs text-muted-foreground">Most recent compliance check</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Your projects</h2>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a project to generate a compliance profile and checklist.</p>
            <Link href="/projects/new" className="mt-4 inline-block">
              <Button>Create your first project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={String(p.id)} href={`/projects/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{String(p.name)}</CardTitle>
                    <Badge tone={scoreTone(p.readiness_score as number | null)}>
                      {p.readiness_score != null ? `${p.readiness_score}%` : "Not checked"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="truncate">
                    {String(p.occupancy ?? "—")}{p.floors != null ? ` · ${p.floors} storeys` : ""}
                  </p>
                  <p className="truncate">{String(p.location_assembly ?? p.location_region ?? "Location not set")}</p>
                  <p className="mt-2 text-xs">{String(p.project_type ?? "New construction")} · updated {new Date(String(p.updated_at)).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
