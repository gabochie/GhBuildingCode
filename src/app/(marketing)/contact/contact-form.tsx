"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Select, Textarea } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
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
        body: JSON.stringify({
          name,
          email,
          phone,
          interest: topic || "general_enquiry",
          message,
          source: "marketing_form",
          channel: "web"
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Submission failed.");
      trackEvent("lead_contact_submitted", topic ? { topic } : undefined);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message received</CardTitle>
          <CardDescription>
            Thanks for reaching out. Our team will reply to {email || "your email"} — usually within one business day.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send us a message</CardTitle>
        <CardDescription>Questions about pricing, the Academy, partnerships or your account — we&apos;ll get back to you.</CardDescription>
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
            <Label htmlFor="topic">Topic</Label>
            <Select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">General enquiry</option>
              <option value="sales_pricing">Sales &amp; pricing</option>
              <option value="support">Support</option>
              <option value="academy">Academy &amp; certification</option>
              <option value="partnership">Partnerships</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
