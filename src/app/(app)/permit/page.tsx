"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Select, Label, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Loader2, ClipboardList, FileCheck2 } from "lucide-react";

interface Project { id: string; name: string; location_assembly: string }
interface Authority { id: string; name: string }
interface ChecklistItem { id: string; category: string; item: string; status: string }
interface Checklist { id: string; project_id: string; authority_id: string | null; title: string }

const STATUS_TONE: Record<string, "success" | "warning" | "default" | "info"> = {
  complete: "success",
  pending: "default",
  review: "warning",
  na: "info"
};

export default function PermitPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [projectId, setProjectId] = useState("");
  const [authorityId, setAuthorityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [pj, au] = await Promise.all([
        fetch("/api/v1/projects").then((r) => r.json()),
        fetch("/api/v1/authorities").then((r) => r.json())
      ]);
      setProjects(pj.data?.projects ?? []);
      setAuthorities(au.data?.authorities ?? []);
    } catch { /* non-critical — silently ignore */ }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, authority_id: authorityId || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Could not generate checklist.");
      await loadChecklists(json.data.checklist.project_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate checklist.");
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklists(pid: string) {
    const res = await fetch(`/api/v1/checklists?project_id=${encodeURIComponent(pid)}`);
    const json = await res.json();
    const all: Record<string, ChecklistItem[]> = {};
    for (const cl of json.data?.checklists ?? []) {
      const r = await fetch(`/api/v1/checklists/${cl.id}`);
      const j = await r.json();
      all[cl.id] = j.data?.items ?? [];
    }
    setChecklists(all);
  }

  async function setStatus(checklistId: string, itemId: string, status: string) {
    await fetch(`/api/v1/checklists/${checklistId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, status })
    });
    await loadChecklists(projectId);
  }

  const checklistIds = Object.keys(checklists);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Permit Readiness"
        description="Generate the document checklist a reviewing authority will expect, and track progress."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={projectId} onChange={(e) => { setProjectId(e.target.value); setChecklists({}); }}>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reviewing authority</Label>
              <Select value={authorityId} onChange={(e) => setAuthorityId(e.target.value)}>
                <option value="">Generic categories</option>
                {authorities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading || !projectId}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                Generate
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {checklistIds.length === 0 && projectId && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No checklists yet for this project. Generate one above.
          </CardContent>
        </Card>
      )}

      {checklistIds.map((id) => {
        const items = checklists[id];
        const done = items.filter((i) => i.status === "complete").length;
        return (
          <Card key={id} className="mb-5">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Checklist {id.slice(-6)}</CardTitle>
              <Badge tone={done === items.length ? "success" : "info"}><FileCheck2 className="h-3 w-3" /> {done}/{items.length}</Badge>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{it.item}</p>
                      <p className="text-xs text-muted-foreground">{it.category}</p>
                    </div>
                    <div className="flex gap-1">
                      {(["pending", "complete", "review", "na"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(id, it.id, s)}
                          className={`rounded-md border px-2 py-1 text-xs transition-colors ${it.status === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                        >
                          {s === "na" ? "N/A" : s}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {checklistIds.length === 0 && !projectId && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Select a project to see its checklist</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Checklists map your project to authority requirements and GS 1207:2018 documents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
