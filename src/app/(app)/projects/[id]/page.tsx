import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb, parseJson } from "@/lib/db";
import { searchRequirements } from "@/lib/ai/retrieval";
import { occupancyGroups } from "@/lib/compliance/check";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, THead, TR, TH, TD } from "@/components/ui";
import { ProjectActions } from "@/components/project-actions";
import { statusLabel } from "@/lib/rules/engine";

const SEVERITY_TONE: Record<string, "destructive" | "warning" | "info" | "success" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "default",
  INFORMATION: "info"
};

const STATUS_TONE: Record<string, "destructive" | "warning" | "info" | "success" | "default"> = {
  PASS: "success",
  FAIL: "destructive",
  REVIEW: "warning",
  "NOT APPLICABLE": "default",
  "MISSING INFORMATION": "info",
  "NOT VERIFIED": "warning"
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const db = getDb();
  const project = db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(id, session!.sub) as
    | Record<string, unknown>
    | undefined;
  if (!project) notFound();

  const findings = db
    .prepare("SELECT * FROM compliance_findings WHERE project_id = ? ORDER BY severity DESC LIMIT 60")
    .all(id) as Array<Record<string, unknown>>;

  const special = parseJson<string[]>(String(project.special_conditions ?? "[]"), []);
  const retrieved = searchRequirements({ query: occupancyGroups(String(project.occupancy ?? "")).join(" "), limit: 18 });
  const authority = project.authority_id
    ? (db.prepare("SELECT name FROM authorities WHERE id = ?").get(project.authority_id) as { name: string } | undefined)
    : undefined;

  const score = project.readiness_score as number | null;
  const scoreTone = score == null ? "default" : score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";

  return (
    <div>
      <PageHeader
        title={String(project.name)}
        description="Project compliance profile — deterministic rules + source-backed requirements."
        actions={<ProjectActions projectId={id} />}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge tone={scoreTone as "success" | "warning" | "destructive" | "default"}>
          GHBC Readiness Score {score != null ? `${score}%` : "—"}
        </Badge>
        <Badge>{String(project.status ?? "draft")}</Badge>
        <Badge tone="info">{String(project.occupancy ?? "occupancy not set")}</Badge>
        {authority && <Badge>{authority.name}</Badge>}
        <span className="text-xs text-muted-foreground">
          Readiness Score is preliminary intelligence, not a compliance certification.
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Project inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Type", project.project_type],
              ["Location", `${project.location_assembly ?? ""}${project.location_region ? `, ${project.location_region}` : ""}`],
              ["Storeys", project.floors],
              ["Height (m)", project.building_height],
              ["Floor area (m²)", project.floor_area],
              ["Site area (m²)", project.site_area],
              ["Occupants", project.occupants],
              ["Structure", project.structural_system],
              ["Basement", project.basement ? "Yes" : "No"],
              ["Roof", project.roof_type]
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between gap-3">
                <span className="text-muted-foreground">{String(k)}</span>
                <span className="text-right font-medium">{v != null ? String(v) : "—"}</span>
              </div>
            ))}
            {special.length > 0 && (
              <div className="border-t border-border pt-2">
                <span className="text-muted-foreground">Special conditions</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {special.map((s) => <Badge key={s} tone="info">{s.replace(/_/g, " ")}</Badge>)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Findings</CardTitle>
          </CardHeader>
          <CardContent>
            {findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No findings yet. Run a compliance review to generate the finding set.
              </p>
            ) : (
              <ul className="space-y-3">
                {findings.map((f) => (
                  <li key={String(f.id)} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={SEVERITY_TONE[String(f.severity)] ?? "default"}>{String(f.severity)}</Badge>
                      <Badge tone={STATUS_TONE[statusLabel(String(f.status))] ?? "default"}>{statusLabel(String(f.status))}</Badge>
                      <span className="text-sm font-medium">{String(f.issue)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{String(f.reason)}</p>
                    {f.recommended_action ? <p className="mt-1 text-xs">→ {String(f.recommended_action)}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Compliance matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Requirement</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Source</TH>
                <TH>Responsible professional</TH>
                <TH>Evidence</TH>
              </TR>
            </THead>
            <tbody>
              {retrieved.map((r) => (
                <TR key={r.requirement_id}>
                  <TD className="max-w-md">
                    <p className="line-clamp-2 text-xs text-muted-foreground">{r.source_text}</p>
                  </TD>
                  <TD><Badge tone="info">{r.requirement_type}</Badge></TD>
                  <TD><Badge tone="warning">NOT VERIFIED</Badge></TD>
                  <TD className="text-xs">
                    {r.source_document} P{r.part}{r.section ? ` §${r.section}` : ""}
                    <br /><span className="text-muted-foreground">{r.clause}</span>
                  </TD>
                  <TD className="text-xs">Architect / Engineer</TD>
                  <TD className="text-xs text-muted-foreground">—</TD>
                </TR>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">
            Matrix rows are source-backed applicable requirements. Statuses require professional verification; PASS is never assumed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
