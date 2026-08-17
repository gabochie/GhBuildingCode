"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Textarea, Select } from "@/components/ui";
import { Check, Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "free",
    label: "FREE",
    name: "Free",
    monthly: "US$0",
    tagline: "Try GHBC",
    features: ["Code explorer", "1 project", "5 AI questions / month", "3 compliance checks / month", "Basic permit checklist"]
  },
  {
    id: "professional",
    label: "PROFESSIONAL",
    name: "Professional",
    monthly: "US$29",
    tagline: "For architects and consultants",
    features: ["Multiple projects (10)", "AI copilot with project context", "Compliance reviews", "Document uploads", "PDF compliance reports", "Project history"]
  },
  {
    id: "studio",
    label: "STUDIO",
    name: "Studio",
    monthly: "US$99",
    tagline: "For practices",
    features: ["Everything in Professional", "Advanced compliance", "Authority intelligence", "API access (3 keys)", "Project templates"]
  },
  {
    id: "enterprise",
    label: "ENTERPRISE",
    name: "Enterprise",
    monthly: "Custom",
    tagline: "For developers, banks, insurers, government",
    features: ["Unlimited projects & usage", "API", "SSO", "Audit logs", "Dedicated deployment", "Custom knowledge base"]
  }
];

export default function UpgradeClient({ currentPlan, email }: { currentPlan: string; email: string }) {
  const [plan, setPlan] = useState(currentPlan === "free" ? "professional" : currentPlan);
  const [organization, setOrganization] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDone("");
    try {
      const res = await fetch("/api/v1/billing/request-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, organization, phone, message })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Request failed.");
      setDone(json.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Plans & Pricing"
        description={currentPlan === "free" ? "You're on Free. Upgrade to unlock more projects, reports, documents and AI usage." : `Current plan: ${currentPlan.toUpperCase()}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan;
          const highlighted = p.id === plan && !isCurrent;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`rounded-xl border p-5 text-left transition-all ${highlighted ? "border-primary shadow-md" : "border-border"} ${isCurrent ? "bg-primary/5" : "bg-card"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-primary">{p.label}</span>
                {isCurrent ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">CURRENT</span> : null}
              </div>
              <h3 className="mt-2 text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-2 text-2xl font-extrabold">{p.monthly}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Request {PLANS.find((p) => p.id === plan)?.name} access</CardTitle>
          <CardDescription>
            No online payment yet — our team activates plans on request. We&apos;ll contact you at {email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan">Requested plan</Label>
              <Select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                {PLANS.filter((p) => p.id !== "free").map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.monthly}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organization">Organization (optional)</Label>
              <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your firm or company" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 ..." />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="message">How will you use GHBC? (optional)</Label>
              <Textarea id="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Projects per year, team size, use cases..." />
            </div>
            <div className="sm:col-span-2">
              {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
              {done && <p className="mb-3 text-sm text-green-700">{done}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending request…" : "Request access"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
