"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { KeyRound, Copy, Check, Loader2 } from "lucide-react";

interface ApiKey { id: string; name: string; scopes_json: string; status: string; last_used_at: string | null; created_at: string }

const ENDPOINTS = [
  ["GET /api/v1/requirements", "List/filter building requirements"],
  ["GET /api/v1/search?q=…", "FTS5 keyword search across requirements, chunks and definitions"],
  ["GET /api/v1/parts · /parts/:partNo", "Browse the code by part"],
  ["GET /api/v1/regulations", "List regulation documents"],
  ["GET /api/v1/occupancies · /api/v1/definitions", "Occupancy groups and terms"],
  ["GET /api/v1/authorities", "Reviewing authorities and checklists"],
  ["POST /api/v1/agent/compliance-check", "Agent: run a compliance check (Bearer key)"],
  ["GET /api/v1/agent/capabilities", "Agent: discover capabilities"],
  ["POST /api/v1/ai/ask", "AI copilot Q&A with citations"]
];

export default function ApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    const res = await fetch("/api/v1/api-keys");
    const json = await res.json();
    setKeys(json.data?.keys ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setNewKey("");
    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Failed.");
      setNewKey(json.data.key);
      setName("");
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <PageHeader title="API & Developer Access" description="Software-agnostic REST API. Authenticate with a Bearer API key for agent use." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> API keys</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={create} className="mb-4 flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design agent" />
              <Button type="submit" disabled={loading || !name.trim()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
            </form>
            {newKey && (
              <div className="mb-4 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                <p className="font-mono break-all">{newKey}</p>
                <p className="mt-1 text-xs text-muted-foreground">Store it securely — it is shown only once.</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={copyKey}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
            <ul className="divide-y divide-border">
              {keys.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {k.scopes_json} · {k.status} · {k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleDateString()}` : "never used"}
                    </p>
                  </div>
                  <Badge tone={k.status === "active" ? "success" : "default"}>{k.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Endpoints</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {ENDPOINTS.map(([ep, desc]) => (
                <li key={ep} className="py-2.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">{ep}</code>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Authenticate: <code className="text-primary">Authorization: Bearer ghbc_live_…</code>. All agent responses carry the same source-backed guarantees as the UI.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
