"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Label, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Loader2, ShieldCheck } from "lucide-react";

interface CheckResult {
  status: string;
  applicable_requirements: Array<{ requirement_id: string; source: string; requirement_type: string; editorial_state: string }>;
  issues: Array<{ rule_id: string; status: string; severity: string; issue: string; reason: string; source_reference: string }>;
  missing_information: string[];
  sources: Array<{ status: string; clause: string }>;
  confidence: number;
}

const SEVERITY_TONE: Record<string, "destructive" | "warning" | "info" | "success" | "default"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "default",
  INFORMATION: "info"
};

export default function CompliancePage() {
  const [form, setForm] = useState({ occupancy: "residential", storeys: "3", building_height: "", floor_area: "", occupants: "", basement: "false", project_type: "new_construction", location: "" });
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/v1/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          storeys: form.storeys ? Number(form.storeys) : undefined,
          building_height: form.building_height ? Number(form.building_height) : undefined,
          floor_area: form.floor_area ? Number(form.floor_area) : undefined,
          occupants: form.occupants ? Number(form.occupants) : undefined,
          basement: form.basement === "true"
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Check failed.");
      setResult(json.data as CheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Compliance Check"
        description="Ad-hoc agent check. GHBC constructs the applicable requirements and deterministic findings for the profile you describe."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Describe the building</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Occupancy</Label>
              <Select value={form.occupancy} onChange={(e) => set("occupancy", e.target.value)}>
                <option value="residential">Residential (R)</option>
                <option value="assembly">Assembly (A)</option>
                <option value="business">Business (B)</option>
                <option value="educational">Educational (E)</option>
                <option value="institutional">Institutional (I)</option>
                <option value="mercantile">Mercantile (M)</option>
                <option value="industrial">Industrial (F)</option>
                <option value="storage">Storage (S)</option>
                <option value="high_hazard">High Hazard (H)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project type</Label>
              <Select value={form.project_type} onChange={(e) => set("project_type", e.target.value)}>
                <option value="new_construction">New construction</option>
                <option value="renovation">Renovation</option>
                <option value="extension">Extension</option>
                <option value="change_of_use">Change of use</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Storeys</Label>
              <Input type="number" min={0} value={form.storeys} onChange={(e) => set("storeys", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Building height (m)</Label>
              <Input type="number" step="0.1" value={form.building_height} onChange={(e) => set("building_height", e.target.value)} placeholder="e.g. 12" />
            </div>
            <div className="space-y-1.5">
              <Label>Floor area (m²)</Label>
              <Input type="number" value={form.floor_area} onChange={(e) => set("floor_area", e.target.value)} placeholder="e.g. 1200" />
            </div>
            <div className="space-y-1.5">
              <Label>Occupants</Label>
              <Input type="number" value={form.occupants} onChange={(e) => set("occupants", e.target.value)} placeholder="e.g. 60" />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. East Legon, Accra" />
            </div>
            <div className="space-y-1.5">
              <Label>Basement</Label>
              <Select value={form.basement} onChange={(e) => set("basement", e.target.value)}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? "Checking…" : "Run check"}
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={result.status === "action_required" ? "destructive" : "warning"}>{result.status.replace(/_/g, " ")}</Badge>
                <Badge tone="info">confidence {Math.round(result.confidence * 100)}%</Badge>
                <Badge>{result.sources.length} sources</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Deterministic findings + source-backed applicable requirements. Statuses are NOT VERIFIED until a professional confirms them.
              </p>
            </CardContent>
          </Card>

          {result.issues.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Findings ({result.issues.length})</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {result.issues.map((f) => (
                    <li key={f.rule_id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={SEVERITY_TONE[f.severity] ?? "default"}>{f.severity}</Badge>
                        <Badge tone={f.status === "PASS" ? "success" : "warning"}>{f.status.replace(/_/g, " ")}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{f.rule_id}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium">{f.issue}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{f.reason}</p>
                      {f.source_reference && <p className="mt-1 font-mono text-xs text-primary">Source: {f.source_reference}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.missing_information.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Missing information</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.missing_information.map((m) => <Badge key={m} tone="info">{m.replace(/_/g, " ")}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Applicable requirements ({result.applicable_requirements.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {result.applicable_requirements.map((r) => (
                  <li key={r.requirement_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{r.requirement_type}</p>
                      <p className="font-mono text-xs text-muted-foreground">{r.source}</p>
                    </div>
                    <Badge tone={r.editorial_state === "VERIFIED" ? "success" : "warning"}>{r.editorial_state}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
