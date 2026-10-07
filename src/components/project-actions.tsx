"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Loader2, RefreshCw, FileDown } from "lucide-react";

export function ProjectActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function runReview() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/review`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Review failed.");
      setMessage(`Review complete — GHBC Readiness Score ${json.data.readiness_score}%`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Review failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={runReview} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {loading ? "Reviewing…" : "Run Compliance Review"}
      </Button>
      <Button asChild variant="outline">
        <a href={`/api/v1/projects/${projectId}/report`} target="_blank" rel="noreferrer">
          <FileDown className="h-4 w-4" /> Download PDF Report
        </a>
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}
