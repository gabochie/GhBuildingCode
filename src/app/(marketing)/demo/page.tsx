"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Textarea } from "@/components/ui";

export default function DemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, organization, interest, message, source: "marketing_form", channel: "web" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Submission failed.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Thank you!</CardTitle>
            <CardDescription>Our team will reach out to you shortly to discuss how GHBC can help with your building compliance needs.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Book a Demo</CardTitle>
          <CardDescription>See how GHBC can streamline your building compliance workflow. Our team will walk you through the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kofi Mensah" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org">Organization (optional)</Label>
              <Input id="org" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Architecture firm, developer, etc." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interest">What are you interested in?</Label>
              <select
                id="interest"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a topic</option>
                <option value="compliance">Compliance Check</option>
                <option value="code_explorer">Code Explorer</option>
                <option value="copilot">AI Copilot</option>
                <option value="permit">Permit Readiness</option>
                <option value="voice">Voice Agent</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your project or question…" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Request Demo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
