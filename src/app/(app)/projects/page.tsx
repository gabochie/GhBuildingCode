import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Plus, ArrowRight } from "lucide-react";

export default async function ProjectsPage() {
  const session = await getSession();
  const db = await getDb();
  const projects = (await db
    .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
    .all(session!.sub)) as Array<Record<string, unknown>>;

  const scoreTone = (s: number | null) => {
    if (s == null) return "default";
    if (s >= 80) return "success";
    if (s >= 60) return "warning";
    return "destructive";
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Your project compliance workspace — each project has a profile, compliance matrix and checklist."
        actions={
          <Link href="/projects/new">
            <Button><Plus className="h-4 w-4" /> New project</Button>
          </Link>
        }
      />
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a project, describe the building, and GHBC constructs the applicable requirements.
            </p>
            <Link href="/projects/new" className="mt-5 inline-block">
              <Button>Check My Project <ArrowRight className="h-4 w-4" /></Button>
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
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{String(p.occupancy ?? "Occupancy not set")}</p>
                  <p>{String(p.location_assembly ?? p.location_region ?? "Location not set")}</p>
                  <p>{String(p.project_type ?? "New construction")} · {p.floors != null ? `${p.floors} storeys` : "storeys not set"}</p>
                  <p className="text-xs">Updated {new Date(String(p.updated_at)).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
