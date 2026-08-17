import { redirect } from "next/navigation";
import { getSession, getDbUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, THead, TR, TH, TD } from "@/components/ui";
import { PlanEditor } from "./plan-editor";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await getDbUser(session);
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const stats = {
    users: (db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c,
    projects: (db.prepare("SELECT COUNT(*) c FROM projects").get() as { c: number }).c,
    requirements: (db.prepare("SELECT COUNT(*) c FROM requirements").get() as { c: number }).c,
    verified: (db.prepare("SELECT COUNT(*) c FROM requirements WHERE editorial_state = 'VERIFIED'").get() as { c: number }).c,
    notVerified: (db.prepare("SELECT COUNT(*) c FROM requirements WHERE editorial_state != 'VERIFIED'").get() as { c: number }).c,
    authorities: (db.prepare("SELECT COUNT(*) c FROM authorities").get() as { c: number }).c,
    findings: (db.prepare("SELECT COUNT(*) c FROM compliance_findings WHERE severity IN ('CRITICAL','HIGH')").get() as { c: number }).c,
    leads: (db.prepare("SELECT COUNT(*) c FROM upgrade_leads WHERE status = 'new'").get() as { c: number }).c
  };

  const audit = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 15").all() as Array<Record<string, unknown>>;
  const users = db.prepare("SELECT id, email, name, role, plan, created_at FROM users ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
  const leads = db.prepare("SELECT * FROM upgrade_leads ORDER BY created_at DESC LIMIT 20").all() as Array<Record<string, unknown>>;
  const genLeads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT 30").all() as Array<Record<string, unknown>>;
  const genLeadCount = (db.prepare("SELECT COUNT(*) c FROM leads WHERE status = 'new'").get() as { c: number }).c;

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Platform statistics and source-verification oversight."
        actions={<Badge tone="primary">Admin</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Users", stats.users],
          ["Projects", stats.projects],
          ["Requirements", stats.requirements],
          ["Verified", `${stats.verified} / ${stats.requirements}`]
        ].map(([k, v]) => (
          <Card key={String(k)}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold">{String(v)}</p>
              <p className="text-xs text-muted-foreground">{String(k)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{stats.notVerified.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Requirements needing human verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{stats.authorities}</p>
            <p className="text-xs text-muted-foreground">Authorities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{stats.findings}</p>
            <p className="text-xs text-muted-foreground">Open CRITICAL/HIGH findings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{stats.leads}</p>
            <p className="text-xs text-muted-foreground">New upgrade leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-2xl font-bold">{genLeadCount}</p>
            <p className="text-xs text-muted-foreground">New voice / demo leads</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-warning/30 bg-warning/5">
        <CardHeader><CardTitle className="text-sm">Setup Checklist</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span> Blog system — seeded with 4 SEO-optimised posts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span> AI content pipeline — configured (Gemini free tier + OpenRouter fallback)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span> Sitemap + robots.txt + RSS feed
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span> Schema.org (Article, FAQPage, Organization) + Open Graph
            </li>
            <li className="flex items-center gap-2">
              <span className="text-success">✓</span> Password reset flow
            </li>
            <li className="flex items-center gap-2">
              <span className="text-warning">○</span> Email delivery — add <code className="rounded bg-muted px-1 py-0.5 text-xs">BREVO_API_KEY</code> and <code className="rounded bg-muted px-1 py-0.5 text-xs">BREVO_SENDER_EMAIL</code> to <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> to enable password reset emails
            </li>
            <li className="flex items-center gap-2">
              <span className="text-muted-foreground">○</span> OpenGraph images — add cover images to blog posts for richer social previews
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Users & plans</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Plan</TH><TH>Joined</TH><TH>Change plan</TH></TR>
            </THead>
            <tbody>
              {users.map((u) => (
                <TR key={String(u.id)}>
                  <TD className="text-sm">{String(u.name || "—")}</TD>
                  <TD className="text-xs text-muted-foreground">{String(u.email)}</TD>
                  <TD><Badge tone={u.role === "admin" ? "primary" : "default"}>{String(u.role)}</Badge></TD>
                  <TD><Badge tone={String(u.plan) === "free" ? "default" : "primary"}>{String(u.plan).toUpperCase()}</Badge></TD>
                  <TD className="text-xs text-muted-foreground">{String(u.created_at)}</TD>
                  <TD><PlanEditor userId={String(u.id)} current={String(u.plan)} /></TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      {leads.length > 0 ? (
        <Card className="mt-6">
          <CardHeader><CardTitle>Upgrade leads</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR><TH>Date</TH><TH>Email</TH><TH>Name</TH><TH>Org</TH><TH>Phone</TH><TH>Plan</TH><TH>Message</TH></TR>
              </THead>
              <tbody>
                {leads.map((l) => (
                  <TR key={String(l.id)}>
                    <TD className="text-xs text-muted-foreground">{String(l.created_at)}</TD>
                    <TD className="text-xs">{String(l.email)}</TD>
                    <TD className="text-xs">{String(l.name || "—")}</TD>
                    <TD className="text-xs">{String(l.organization || "—")}</TD>
                    <TD className="text-xs">{String(l.phone || "—")}</TD>
                    <TD><Badge tone="primary">{String(l.requested_plan).toUpperCase()}</Badge></TD>
                    <TD className="text-xs">{String(l.message || "—")}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {genLeads.length > 0 ? (
        <Card className="mt-6">
          <CardHeader><CardTitle>Voice &amp; demo leads</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR><TH>Date</TH><TH>Name</TH><TH>Email</TH><TH>Phone</TH><TH>Source</TH><TH>Channel</TH><TH>Interest</TH><TH>Status</TH></TR>
              </THead>
              <tbody>
                {genLeads.map((l) => (
                  <TR key={String(l.id)}>
                    <TD className="text-xs text-muted-foreground">{String(l.created_at)}</TD>
                    <TD className="text-xs">{String(l.name || "—")}</TD>
                    <TD className="text-xs">{String(l.email)}</TD>
                    <TD className="text-xs">{String(l.phone || "—")}</TD>
                    <TD><Badge tone="default">{String(l.source)}</Badge></TD>
                    <TD><Badge tone="default">{String(l.channel)}</Badge></TD>
                    <TD className="text-xs">{String(l.interest || "—")}</TD>
                    <TD><Badge tone={String(l.status) === "new" ? "warning" : "default"}>{String(l.status)}</Badge></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader><CardTitle>Audit log</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Time</TH><TH>User</TH><TH>Action</TH><TH>Entity</TH></TR>
            </THead>
            <tbody>
              {audit.map((a) => (
                <TR key={String(a.id)}>
                  <TD className="text-xs text-muted-foreground">{String(a.created_at)}</TD>
                  <TD className="font-mono text-xs">{String(a.user_id).slice(-6)}</TD>
                  <TD><Badge tone="default">{String(a.action)}</Badge></TD>
                  <TD className="text-xs">{String(a.entity_type)} · {String(a.entity_id).slice(-8)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
