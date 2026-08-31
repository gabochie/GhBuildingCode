import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, getDbUser } from "@/lib/auth/session";
import { getPlan, getUsage } from "@/lib/billing/plans";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { ArrowRight } from "lucide-react";

function meter(used: number, limit: number) {
  const pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / limit) * 100));
  return { pct, unlimited: limit === Infinity };
}

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await getDbUser(session);
  if (!user) redirect("/login");

  const plan = getPlan(user.plan);
  const usage = await getUsage(user.id);
  const L = plan.limits;

  const rows: Array<{ label: string; used: number; limit: number }> = [
    { label: "Projects", used: usage.projects, limit: L.projects },
    { label: "Documents", used: usage.documents, limit: L.documents },
    { label: "API keys", used: usage.apiKeys, limit: L.apiKeys },
    { label: "AI questions (this month)", used: usage.aiQuestions, limit: L.aiQuestionsPerMonth },
    { label: "Compliance checks (this month)", used: usage.complianceChecks, limit: L.complianceChecksPerMonth },
    { label: "PDF reports (this month)", used: usage.reports, limit: L.reportsPerMonth }
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Account"
        description="Your profile and plan usage."
        actions={
          <SignOutButton
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:bg-muted"
            label="Sign out"
          />
        }
      />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile
            <Link href="/upgrade" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {plan.leadGen ? "Upgrade" : "Change plan"} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ["Name", user.name],
            ["Email", user.email],
            ["Role", user.role]
          ].map(([k, v]) => (
            <div key={String(k)} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Plan</span>
            <Badge tone={plan.leadGen ? "default" : "primary"}>{plan.label}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage — {plan.label} plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((r) => {
            const m = meter(r.used, r.limit);
            return (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{r.label}</span>
                  <span className="text-muted-foreground">
                    {m.unlimited ? `${r.used} / unlimited` : `${r.used} / ${r.limit}`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${m.unlimited ? "bg-muted" : r.used >= r.limit ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${m.unlimited ? 100 : Math.max(4, m.pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="pt-2 text-xs text-muted-foreground">
            Monthly usage resets on the first of each month. Paid plans are activated on request by the GHBC team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
