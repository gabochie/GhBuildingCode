"use client";

import { useState } from "react";
import { Select, Button } from "@/components/ui";
import { Check, Loader2 } from "lucide-react";

export function RoleEditor({ userId, current }: { userId: string; current: string }) {
  const [role, setRole] = useState(current);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.data?.error || "Failed.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onChange={(e) => setRole(e.target.value)} className="h-8 w-28 text-xs">
        {["user", "admin"].map((r) => (
          <option key={r} value={r}>{r.toUpperCase()}</option>
        ))}
      </Select>
      <Button size="sm" variant="outline" onClick={save} disabled={saving || role === current}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 text-green-600" /> : "Apply"}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
