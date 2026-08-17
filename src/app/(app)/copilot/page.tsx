"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, Label, Button, Badge, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Send, Bot, User, Loader2, ShieldAlert } from "lucide-react";

interface Citation {
  requirement_id: string;
  source_document: string;
  part: string;
  section: string;
  clause: string;
  snippet: string;
  status: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  safety_flag?: string;
  used_ai?: boolean;
  error?: boolean;
}

const SAFETY_TONE: Record<string, "destructive" | "warning" | "info"> = {
  NONE: "success" as unknown as "info",
  REVIEW_REQUIRED: "warning",
  SOURCE_NOT_VERIFIED: "warning",
  REGULATORY_CONFLICT_DETECTED: "destructive"
};

export default function CopilotPage() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/v1/projects").then((r) => r.json()).then((j) => setProjects(j.data?.projects ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, project_id: projectId || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Request failed.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: json.data.answer,
          citations: json.data.citations,
          confidence: json.data.confidence,
          safety_flag: json.data.safety_flag,
          used_ai: json.data.used_ai
        }
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err instanceof Error ? err.message : "Request failed.", error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <PageHeader
        title="AI Copilot"
        description="Ask questions about building requirements. Answers cite GS 1207:2018 sources with confidence and safety flags."
      />

      <Card className="mb-4">
        <CardContent className="pt-5">
          <Label>Project context (optional)</Label>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1">
            <option value="">General question — no project context</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card className="flex-1 overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> GHBC Copilot</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
          <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            {messages.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Ask about the Ghana Building Code</p>
                <p className="mt-1">e.g. “What are the stair riser and tread limits?” · “When is a sprinkler required?” · “How many exits does my 3-storey office need?”</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>}
                <div className={`max-w-[85%] space-y-2 rounded-lg border p-3 ${m.role === "user" ? "border-primary/30 bg-primary/5" : m.error ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                  {m.role === "user" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><User className="h-4 w-4" /></div>}
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                  {m.role === "assistant" && !m.error && (
                    <div className="space-y-2 border-t border-border pt-2">
                      {m.safety_flag && m.safety_flag !== "NONE" && (
                        <p className="flex items-center gap-1.5 text-xs">
                          <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                          <Badge tone={SAFETY_TONE[m.safety_flag] ?? "warning"}>{m.safety_flag.replace(/_/g, " ")}</Badge>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations?.map((c, j) => (
                          <span key={j} className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {c.source_document} P{c.part}{c.section ? ` §${c.section}` : ""} · {c.status}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
                <div className="rounded-lg border border-border bg-card p-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={ask} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about building requirements…"
              className="min-h-0 flex-1 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(e); } }}
            />
            <Button type="submit" disabled={loading || !input.trim()} className="self-end">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
