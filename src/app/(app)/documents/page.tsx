"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, Label, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { UploadCloud, FileText, Loader2, FileSearch } from "lucide-react";

interface Project { id: string; name: string }
interface Document { id: string; filename: string; doc_type: string; status: string; size: number }
interface ReviewFinding { issue: string; severity: string; confidence: number; recommended_action: string }

const SEVERITY_TONE: Record<string, "destructive" | "warning" | "default" | "info" | "success"> = {
  CRITICAL: "destructive",
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "default",
  INFORMATION: "info"
};

export default function DocumentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [docs, setDocs] = useState<Document[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("general");
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ text_length: number; features: ReviewFinding[] } | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [pj, dc] = await Promise.all([
        fetch("/api/v1/projects").then((r) => r.json()),
        projectId ? fetch(`/api/v1/documents?project_id=${encodeURIComponent(projectId)}`).then((r) => r.json()) : Promise.resolve({ data: { documents: [] } })
      ]);
      setProjects(pj.data?.projects ?? []);
      setDocs(dc.data?.documents ?? []);
    } catch { /* non-critical — silently ignore */ }
  }

  useEffect(() => { refresh(); }, [projectId]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !file) return;
    setBusy(true);
    setError("");
    setReview(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("project_id", projectId);
      fd.append("doc_type", docType);
      const res = await fetch("/api/v1/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Upload failed.");
      setFile(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function process(id: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/documents/${id}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Processing failed.");
      setReview(json.data.review);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Documents"
        description="Upload plans, drawings notes or reports. GHBC extracts text and flags which building features appear for review."
      />

      <Card className="mb-6">
        <CardHeader><CardTitle>Upload a document</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={upload} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">Select project…</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Document type</Label>
                <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="general">General</option>
                  <option value="architectural">Architectural drawings</option>
                  <option value="structural">Structural drawings</option>
                  <option value="mep">MEP drawings</option>
                  <option value="report">Engineering report</option>
                  <option value="permit">Permit application</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground hover:bg-muted">
                <UploadCloud className="mx-auto mb-1 h-5 w-5" />
                {file ? <span className="font-medium text-foreground">{file.name}</span> : "Click to choose PDF, TXT, MD or JSON (max 15 MB)"}
                <input type="file" accept=".pdf,.txt,.md,.json,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <Button type="submit" disabled={busy || !projectId || !file}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {docs.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Uploaded documents</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{d.filename}</p>
                      <p className="text-xs text-muted-foreground">{d.doc_type} · {(d.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={d.status === "reviewed" ? "success" : "default"}>{d.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => process(d.id)} disabled={busy}>
                      <FileSearch className="h-3.5 w-3.5" /> Review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {review && (
        <Card>
          <CardHeader>
            <CardTitle>Preliminary review ({review.features.length} feature signals)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              {review.text_length.toLocaleString()} characters extracted. These are keyword-based indicators — not measurements. Confirm against the original documents and a registered professional.
            </p>
            <ul className="space-y-3">
              {review.features.map((f, i) => (
                <li key={i} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEVERITY_TONE[f.severity] ?? "default"}>{f.severity}</Badge>
                    <Badge tone="info">{Math.round(f.confidence * 100)}%</Badge>
                    <span className="text-sm font-medium">{f.issue}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">→ {f.recommended_action}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
