"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: "", source: "newsletter", channel: "web" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Could not subscribe.");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Could not subscribe.");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm text-success" role="status">
        You&apos;re on the list. We&apos;ll send Ghana building-compliance updates your way.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md">
      <div className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className={compact ? "h-9" : ""}
        />
        <Button type="submit" disabled={state === "loading"} variant={compact ? "outline" : "default"}>
          {state === "loading" ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
