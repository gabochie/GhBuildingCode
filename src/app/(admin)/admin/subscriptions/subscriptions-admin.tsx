"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "@/components/ui";

interface Subscription {
  id: string;
  user_id: string;
  email: string;
  name: string;
  plan: string;
  status: string;
  gateway: string | null;
  current_period_start: string;
  current_period_end: string;
  updated_at: string;
}

interface Payment {
  id: string;
  user_id: string;
  email: string;
  reference: string;
  plan: string;
  currency: string;
  amount_major: string;
  gateway: string;
  gateway_ref: string | null;
  status: string;
  created_at: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function statusTone(status: string): "success" | "destructive" | "default" | "warning" {
  if (status === "paid" || status === "active") return "success";
  if (status === "failed" || status === "cancelled") return "destructive";
  if (status === "pending") return "warning";
  return "default";
}

export function SubscriptionsAdmin() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [extending, setExtending] = useState<{ userId: string; plan: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/subscriptions");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Failed to load.");
      setSubscriptions(json.data?.subscriptions || []);
      setPayments(json.data?.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscriptions.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleExtend(userId: string, plan: string, months: number) {
    setExtending({ userId, plan });
    try {
      const res = await fetch(`/api/v1/admin/subscriptions/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, months })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Failed to extend.");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend subscription.");
    }
    setExtending(null);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading subscriptions…</p>;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">Ghana payment + plan activation. Renew or extend a user&apos;s period here (in the loop).</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>Refresh</Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold">Active & historic subscriptions</h2>
        {subscriptions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No subscriptions yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Gateway</th>
                  <th className="px-4 py-2 font-medium">Period end</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      <div className="font-medium">{s.name || s.email}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-2 capitalize">{s.plan}</td>
                    <td className="px-4 py-2"><Badge tone={statusTone(s.status)}>{s.status}</Badge></td>
                    <td className="px-4 py-2">{s.gateway ?? "—"}</td>
                    <td className="px-4 py-2">{fmtDate(s.current_period_end)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={extending?.userId === s.user_id}
                          onClick={() => handleExtend(s.user_id, s.plan, 1)}
                        >
                          {extending?.userId === s.user_id ? "…" : "+1 month"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={extending?.userId === s.user_id}
                          onClick={() => handleExtend(s.user_id, s.plan, 12)}
                        >
                          +12 mo
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payments recorded.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Ref</th>
                  <th className="px-4 py-2 font-medium">Plan</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Gateway</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2 font-mono text-xs">{p.reference}</td>
                    <td className="px-4 py-2 capitalize">{p.plan}</td>
                    <td className="px-4 py-2">{p.currency} {p.amount_major}</td>
                    <td className="px-4 py-2">{p.gateway}</td>
                    <td className="px-4 py-2"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
