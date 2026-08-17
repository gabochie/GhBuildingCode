"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, Select, Label, Badge, Button, Input } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { VoiceControls } from "@/components/voice-controls";
import { Bot, User, Loader2, ShieldAlert, Mic } from "lucide-react";

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
  isVoice?: boolean;
}

const SAFETY_TONE: Record<string, "destructive" | "warning" | "info"> = {
  NONE: "success" as unknown as "info",
  REVIEW_REQUIRED: "warning",
  SOURCE_NOT_VERIFIED: "warning",
  REGULATORY_CONFLICT_DETECTED: "destructive"
};

export default function VoicePage() {
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [projectId, setProjectId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [interim, setInterim] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Lead capture state
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/projects").then((r) => r.json()).then((j) => setProjects(j.data?.projects ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showLeadForm]);

  // Stop speech synthesis when a new response arrives or component unmounts
  useEffect(() => {
    return () => { speechSynthesis.cancel(); };
  }, []);

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.startsWith("en")) || voices[0] || null;
    utterance.rate = 1.0;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
  }, []);

  const ask = useCallback(async (question: string) => {
    if (!question.trim() || loading) return;
    setInterim("");
    setMessages(m => [...m, { role: "user", content: question, isVoice: true }]);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, project_id: projectId || undefined })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Request failed.");
      const msg: Message = {
        role: "assistant",
        content: json.data.answer,
        citations: json.data.citations,
        confidence: json.data.confidence,
        safety_flag: json.data.safety_flag,
        used_ai: json.data.used_ai,
        isVoice: true
      };
      setMessages(m => [...m, msg]);
      speak(json.data.answer);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Request failed.";
      setMessages(m => [...m, { role: "assistant", content: errMsg, error: true, isVoice: true }]);
    } finally {
      setLoading(false);
    }
  }, [loading, projectId, speak]);

  const handleTranscript = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setInterim("");
      ask(text);
    } else {
      setInterim(text);
    }
  }, [ask]);

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    setLeadLoading(true);
    try {
      await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName, email: leadEmail, phone: leadPhone,
          source: "voice_browser", channel: "voice",
          interest: "voice_agent", message: "Captured from voice copilot session"
        })
      });
      setLeadSubmitted(true);
    } catch { /* silent */ }
    setLeadLoading(false);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col" style={{ height: "calc(100vh - 140px)" }}>
      <PageHeader
        title="Voice Agent"
        description="Speak your building compliance questions. Answers are read back to you with source citations."
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
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" /> GHBC Voice Agent
            {speaking && <Badge tone="info" className="ml-2 text-[10px]">Speaking…</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
          <div className="space-y-4 overflow-y-auto pr-1 scrollbar-thin">
            {messages.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Tap the microphone and ask a question</p>
                <p className="mt-1">e.g. &quot;What are the fire exit requirements for a 4-storey office?&quot;</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
                )}
                <div className={`max-w-[85%] space-y-2 rounded-lg border p-3 ${m.role === "user" ? "border-primary/30 bg-primary/5" : m.error ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                  {m.role === "user" && (
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><User className="h-4 w-4" /></div>
                      <span className="text-xs text-muted-foreground">Voice</span>
                    </div>
                  )}
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
            {interim && (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm italic text-muted-foreground">{interim}…</p>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
                <div className="rounded-lg border border-border bg-card p-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex flex-col items-center gap-3 border-t border-border pt-4">
            {!leadSubmitted && messages.length >= 2 && !showLeadForm && (
              <Button variant="ghost" size="sm" onClick={() => setShowLeadForm(true)} className="text-xs text-muted-foreground">
                Want a detailed consultation? Contact our team
              </Button>
            )}
            {showLeadForm && !leadSubmitted && (
              <form onSubmit={submitLead} className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Get a follow-up from our team</p>
                <div className="flex gap-2">
                  <Input placeholder="Name" value={leadName} onChange={e => setLeadName(e.target.value)} className="h-8 text-xs" required />
                  <Input placeholder="Email" type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} className="h-8 text-xs" required />
                </div>
                <Input placeholder="Phone (optional)" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} className="h-8 text-xs" />
                <Button type="submit" size="sm" disabled={leadLoading} className="w-full">{leadLoading ? "Submitting…" : "Request Follow-up"}</Button>
              </form>
            )}
            {leadSubmitted && <p className="text-xs text-muted-foreground">Thanks! Our team will be in touch.</p>}
            <VoiceControls onTranscript={handleTranscript} disabled={loading || speaking} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
