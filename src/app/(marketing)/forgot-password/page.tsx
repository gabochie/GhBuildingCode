"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label, Button } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devUrl, setDevUrl] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevUrl("");
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Request failed.");
      setMessage(json.data.message);
      if (json.data._dev_reset_url) setDevUrl(json.data._dev_reset_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    }
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email address and we will send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              {devUrl && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <p className="text-xs font-medium text-warning">Dev mode — reset link:</p>
                  <a href={devUrl} className="mt-1 block break-all text-xs text-primary hover:underline">{devUrl}</a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
