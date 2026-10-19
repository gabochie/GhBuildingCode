"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { TrackedButton } from "@/components/tracked-cta";
import { Check, Sparkles } from "lucide-react";
import { GHS_MONTHLY, GHS_ANNUAL } from "@/lib/billing/price";

// Public pricing display data. Prices come from the shared GHS map in
// src/lib/billing/price.ts (the same source billing uses) so marketing copy
// can never drift from what customers are actually charged.
// Taglines and feature bullets are marketing-specific. Annual = 2 months free.
const pricing = [
  {
    id: "free",
    name: "Free",
    tagline: "Try GHBC",
    monthly: GHS_MONTHLY.free,
    annual: GHS_ANNUAL.free,
    features: ["Ghana Building Code explorer", "1 project", "5 AI questions / month", "Basic permit checklist"]
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "For architects and consultants",
    monthly: GHS_MONTHLY.professional,
    annual: GHS_ANNUAL.professional,
    features: ["Multiple projects (10)", "AI copilot with project context", "Compliance reviews", "PDF compliance reports"]
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For practices",
    monthly: GHS_MONTHLY.studio,
    annual: GHS_ANNUAL.studio,
    features: ["Everything in Professional", "Advanced compliance", "Authority intelligence", "API access (3 keys)"]
  }
];

export default function PricingSection() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${period === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={period === "annual"}
          onClick={() => setPeriod(period === "monthly" ? "annual" : "monthly")}
          className={`relative h-6 w-11 rounded-full transition-colors ${period === "annual" ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${period === "annual" ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium ${period === "annual" ? "text-foreground" : "text-muted-foreground"}`}>Annual</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">2 months free</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {pricing.map((p) => {
          const price = period === "annual" ? p.annual : p.monthly;
          const unit = period === "annual" ? "/yr" : "/mo";
          return (
            <Card key={p.id} className={p.id === "professional" ? "border-primary/40 shadow-md" : ""}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{p.name}</CardTitle>
                  {p.id === "professional" && <Sparkles className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{price}<span className="text-sm font-normal text-muted-foreground"> {unit}</span></p>
                {p.id === "free" ? (
                  <p className="mt-1 text-xs font-medium text-success">No card required — start in under a minute</p>
                ) : period === "annual" && p.id !== "free" ? (
                  <p className="mt-1 text-xs font-medium text-primary">{p.monthly} /mo — 2 months free</p>
                ) : null}
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <TrackedButton
                  href={`/register?plan=${p.id}&period=${period}`}
                  event="cta_pricing"
                  props={{ plan: p.id, period }}
                  className="mt-5 w-full"
                  variant={p.id === "professional" ? "default" : "outline"}
                >
                  {p.id === "free" ? "Start free" : `Get ${p.name}`}
                </TrackedButton>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
