import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { BadgeCheck } from "lucide-react";
import { GHS_MONTHLY, GHS_ANNUAL } from "@/lib/billing/price";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free GHBC account — start with the Free plan, no card required. Unlock the Ghana Building Code explorer, projects and compliance checks."
};

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  professional: "Professional",
  studio: "Studio"
};

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const planKey = typeof sp.plan === "string" && PLAN_NAMES[sp.plan] ? sp.plan : undefined;
  const planName = planKey ? PLAN_NAMES[planKey] : undefined;
  const annual = sp.period === "annual";
  // Price comes from the shared GHS map (src/lib/billing/price.ts) so this page
  // can never drift from what billing actually charges.
  const price =
    planKey && planKey !== "free"
      ? `${annual ? GHS_ANNUAL[planKey] : GHS_MONTHLY[planKey]}${annual ? "/yr" : "/mo"}`
      : undefined;

  // Carry the chosen paid plan through sign-up so it isn't silently dropped.
  // Clerk stores no plan on a self-signup, so we hand the user straight to
  // Upgrade (where billing is explicitly confirmed) instead of the dashboard.
  const upgradeUrl =
    planKey && planKey !== "free"
      ? `/upgrade?plan=${planKey}${annual ? "&period=annual" : ""}`
      : undefined;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16">
      {planName && (
        <div className="w-full rounded-lg border border-primary/30 bg-primary/5 p-3 text-center text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-primary">
            <BadgeCheck className="h-4 w-4" />
            {planKey === "free" ? "Starting on the Free plan — no card required" : `You selected ${planName}`}
          </span>
          {planKey !== "free" && (
            <p className="mt-1 text-xs text-muted-foreground">
              {price} — create your account now; billing starts only after you confirm in Upgrade.
            </p>
          )}
        </div>
      )}
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={upgradeUrl ?? "/dashboard"}
        forceRedirectUrl={upgradeUrl}
      />
      <p className="text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </main>
  );
}
