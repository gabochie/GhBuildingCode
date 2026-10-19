"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { Check, Loader2, Building2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { GHS_MONTHLY, GHS_ANNUAL } from "@/lib/billing/price";

interface GatewayInfo {
  id: string;
  label: string;
}

interface PlanPriceInfo {
  id: string;
  name: string;
  price: { currency: string; amountMinor: string; label: string };
}

// Prices come from the shared GHS map (src/lib/billing/price.ts) — the same
// source billing uses — so the upgrade page can never drift from what is charged.
const PLANS = [
  {
    id: "professional",
    name: "Professional",
    tagline: "For architects and consultants",
    monthly: `${GHS_MONTHLY.professional} / mo`,
    annual: `${GHS_ANNUAL.professional} / yr`,
    features: ["Multiple projects (10)", "AI copilot with project context", "Compliance reviews", "Document uploads", "PDF compliance reports", "Project history"]
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For practices",
    monthly: `${GHS_MONTHLY.studio} / mo`,
    annual: `${GHS_ANNUAL.studio} / yr`,
    features: ["Everything in Professional", "Advanced compliance", "Authority intelligence", "API access (3 keys)", "Project templates"]
  }
];

export default function UpgradeClient({ currentPlan, email }: { currentPlan: string; email: string }) {
  const [plan, setPlan] = useState(currentPlan === "free" ? "professional" : (currentPlan === "professional" || currentPlan === "studio" ? currentPlan : "professional"));
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [phone, setPhone] = useState("");
  const [gateway, setGateway] = useState<GatewayInfo | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [momoMessage, setMomoMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [entOrg, setEntOrg] = useState("");
  const [entPhone, setEntPhone] = useState("");
  const [entMessage, setEntMessage] = useState("");
  const [entState, setEntState] = useState<"idle" | "loading" | "done">("idle");
  const [entError, setEntError] = useState("");

  async function requestEnterprise(e: React.FormEvent) {
    e.preventDefault();
    setEntState("loading");
    setEntError("");
    try {
      const res = await fetch("/api/v1/billing/request-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "enterprise", organization: entOrg, phone: entPhone, message: entMessage })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Request failed.");
      setEntState("done");
      trackEvent("request_enterprise");
    } catch (err) {
      setEntState("idle");
      setEntError(err instanceof Error ? err.message : "Request failed.");
    }
  }

  useEffect(() => {
    fetch("/api/v1/billing/config")
      .then((r) => r.json())
      .then((json) => {
        const list: GatewayInfo[] = json.data?.gateways || [];
        setGateways(list);
        if (list.length) setGateway(list[0]);
      })
      .catch(() => { /* gateway config unavailable */ });
  }, []);

  useEffect(() => {
    if (!pendingRef) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/billing/status?reference=${encodeURIComponent(pendingRef)}`);
        const json = await res.json();
        const status = json.data?.status;
        if (status === "paid") {
          setStatusMessage("Payment confirmed. Your plan is now active — enjoy GHBC.");
          setPendingRef(null);
        } else if (status === "failed" || status === "cancelled") {
          setError("Payment was not completed. Please try again.");
          setPendingRef(null);
        }
      } catch { /* keep polling */ }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => { stopped = true; clearInterval(t); };
  }, [pendingRef]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gateway) { setError("No payment method is configured yet."); return; }
    setLoading(true);
    setError("");
    setStatusMessage("");
    setMomoMessage(null);
    try {
      const res = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, gateway: gateway.id, phone, billingPeriod: period })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Checkout failed.");
      const data = json.data;
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      // Mobile-money flow (Moolre): send prompt to the user's phone, then poll.
      setPendingRef(data.reference);
      setMomoMessage(data.message || "Check your phone and approve the payment.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
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

      <div className="grid gap-4 sm:grid-cols-2">
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
                <span className="text-xs font-bold tracking-wider text-primary">{p.name.toUpperCase()}</span>
                {isCurrent ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">CURRENT</span> : null}
              </div>
              <h3 className="mt-2 text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.tagline}</p>
              <p className="mt-2 text-2xl font-extrabold">{period === "annual" ? p.annual : p.monthly}</p>
              {period === "annual" ? <p className="text-xs font-medium text-primary">2 months free</p> : null}
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

      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${period === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={period === "annual"}
          onClick={() => setPeriod(period === "monthly" ? "annual" : "monthly")}
          className={`relative h-6 w-11 rounded-full transition-colors ${period === "annual" ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${period === "annual" ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium ${period === "annual" ? "text-foreground" : "text-muted-foreground"}`}>Annual</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">2 months free</span>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pay online (Ghana)</CardTitle>
          <CardDescription>
            Pay in Ghana Cedis via local payment methods. Your plan activates automatically once payment is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan">Plan</Label>
              <Select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
                {PLANS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {period === "annual" ? p.annual : p.monthly}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gateway">Payment method</Label>
              <Select id="gateway" value={gateway?.id ?? ""} onChange={(e) => setGateway(gateways.find((g) => g.id === e.target.value) ?? null)}>
                {gateways.length === 0 ? (
                  <option value="">No payment methods available</option>
                ) : (
                  gateways.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))
                )}
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="phone">Mobile Money number (MTN / Telecel / AirtelTigo)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0244 000 000" />
              <p className="text-xs text-muted-foreground">Required for Moolre MoMo. ExpressPay may use it to pre-fill checkout.</p>
            </div>
            <div className="sm:col-span-2">
              {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
              {statusMessage && <p className="mb-3 text-sm text-green-700">{statusMessage}</p>}
              {momoMessage && !statusMessage && <p className="mb-3 text-sm text-muted-foreground">{momoMessage}</p>}
              <Button type="submit" disabled={loading || gateways.length === 0}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {pendingRef ? "Waiting for payment…" : loading ? "Starting checkout…" : `Pay ${(period === "annual" ? PLANS.find((p) => p.id === plan)?.annual : PLANS.find((p) => p.id === plan)?.monthly.split(" ")[0]) ?? ""} now`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Enterprise &amp; custom plans</CardTitle>
          <CardDescription>
            SSO, unlimited usage, audit logs, dedicated deployment or a custom knowledge base. Tell us what you need and our team will set it up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entState === "done" ? (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">Request received.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&apos;ll contact you at <span className="font-medium text-foreground">{email}</span> to discuss your Enterprise plan.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={requestEnterprise} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ent-org">Organization</Label>
                  <Input id="ent-org" value={entOrg} onChange={(e) => setEntOrg(e.target.value)} placeholder="Developer, bank, insurer, government…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ent-phone">Phone (optional)</Label>
                  <Input id="ent-phone" type="tel" value={entPhone} onChange={(e) => setEntPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ent-message">What do you need?</Label>
                <Textarea id="ent-message" value={entMessage} onChange={(e) => setEntMessage(e.target.value)} placeholder="e.g. licensing for a 50-user practice, SSO, on-prem deployment…" />
              </div>
              {entError && <p className="text-sm text-destructive">{entError}</p>}
              <div>
                <Button type="submit" disabled={entState === "loading"} variant="outline">
                  {entState === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Talk to us about Enterprise
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
