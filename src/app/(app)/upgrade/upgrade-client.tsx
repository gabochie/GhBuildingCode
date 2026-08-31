"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label, Select } from "@/components/ui";
import { Check, Loader2 } from "lucide-react";

interface GatewayInfo {
  id: string;
  label: string;
}

interface PlanPriceInfo {
  id: string;
  name: string;
  price: { currency: string; amountMinor: string; label: string };
}

const PLANS = [
  {
    id: "professional",
    name: "Professional",
    monthly: "GH₵399 / mo",
    tagline: "For architects and consultants",
    features: ["Multiple projects (10)", "AI copilot with project context", "Compliance reviews", "Document uploads", "PDF compliance reports", "Project history"]
  },
  {
    id: "studio",
    name: "Studio",
    monthly: "GH₵1,299 / mo",
    tagline: "For practices",
    features: ["Everything in Professional", "Advanced compliance", "Authority intelligence", "API access (3 keys)", "Project templates"]
  }
];

export default function UpgradeClient({ currentPlan, email }: { currentPlan: string; email: string }) {
  const [plan, setPlan] = useState(currentPlan === "free" ? "professional" : (currentPlan === "professional" || currentPlan === "studio" ? currentPlan : "professional"));
  const [phone, setPhone] = useState("");
  const [gateway, setGateway] = useState<GatewayInfo | null>(null);
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [momoMessage, setMomoMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
        body: JSON.stringify({ plan, gateway: gateway.id, phone })
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
                  <option key={p.id} value={p.id}>{p.name} — {p.monthly}</option>
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
                {pendingRef ? "Waiting for payment…" : loading ? "Starting checkout…" : `Pay ${PLANS.find((p) => p.id === plan)?.monthly.split(" ")[0]} now`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
