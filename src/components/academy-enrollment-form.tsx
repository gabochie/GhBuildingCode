"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Textarea } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";

const TRACKS = [
  { value: "gs1207_core", label: "GS 1207 Core Proficiency (Foundation)" },
  { value: "compliance_professional", label: "Building Compliance Professional" },
  { value: "permit_readiness", label: "Permit Readiness Certification" },
  { value: "fire_egress", label: "Fire & Means-of-Egress Specialist" },
  { value: "organization_training", label: "Organization / team training" },
  { value: "not_sure", label: "Not sure yet — help me choose" }
];

export function AcademyEnrollmentForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [track, setTrack] = useState("");
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
          organization,
          interest: track,
          message,
          source: "academy_enrollment",
          channel: "web"
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Submission failed.");
      trackEvent("lead_academy_enrollment", track ? { track } : undefined);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Enrollment request received</CardTitle>
          <CardDescription>
            Our academy team will reach out with program details, start dates and next steps for your certification.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request enrollment</CardTitle>
        <CardDescription>
          Tell us which track interests you and we&apos;ll share the curriculum, schedule and fees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="academy-name">Full name</Label>
            <Input id="academy-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Kofi Mensah" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy-email">Email</Label>
            <Input id="academy-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy-phone">Phone (optional)</Label>
            <Input id="academy-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233 XX XXX XXXX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy-org">Organization (optional)</Label>
            <Input id="academy-org" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Architecture firm, developer, regulator…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy-track">Certification track</Label>
            <select
              id="academy-track"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a track</option>
              {TRACKS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="academy-message">Message (optional)</Label>
            <Textarea id="academy-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Questions about schedule, team training, or custom cohorts…" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting…" : "Request enrollment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}