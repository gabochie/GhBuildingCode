/**
 * Pure pricing & billing-period helpers (no DB / framework imports) so they
 * can run under the plain `node --experimental-strip-types` test runner.
 */

export const GRACE_PERIOD_DAYS = 3;

export const ANNUAL_MONTHS = 12;
export const ANNUAL_BILLED_MONTHS = 10; // 2 months free when you pay annually

export interface PlanPrice {
  currency: "GHS";
  /** Numeric minor-currency value (pesewas) for exact gateway amounts. */
  amountMinor: string;
  label: string;
}

/** GHS monthly price strings by plan id. */
export const GHS_MONTHLY: Record<string, string> = {
  free: "GH₵0",
  professional: "GH₵399",
  studio: "GH₵1,299",
  enterprise: "Custom"
};

/** GHS annual price strings (10 months billed, 2 free). */
export const GHS_ANNUAL: Record<string, string> = {
  free: "GH₵0",
  professional: "GH₵3,990",
  studio: "GH₵12,990",
  enterprise: "Custom"
};

/** Billing cadence identifiers used across checkout, plans and UI. */
export type BillingPeriod = "monthly" | "annual";

/** Map a billing period to the number of months the plan is active for. */
export function periodMonths(period: BillingPeriod): number {
  return period === "annual" ? ANNUAL_MONTHS : 1;
}

/**
 * Parse a GHS price string ("GH₵399") into a minor-currency (pesewa) amount.
 * Numeric, integer-consistent with gateway APIs that expect plain decimals.
 */
export function ghsToMinor(ghs: string): string {
  const cleaned = ghs.replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return "0";
  const major = Math.round(num);
  return String(major);
}

/**
 * Resolve the GHS price for a plan id and billing period.
 * Free/custom plans are not chargeable.
 */
export function planPrice(planId: string, period: BillingPeriod = "monthly"): PlanPrice | null {
  if (planId === "free") return null;
  const raw = period === "annual" ? GHS_ANNUAL[planId] : GHS_MONTHLY[planId];
  if (!raw || raw.toUpperCase().includes("CUSTOM")) return null;
  return { currency: "GHS", amountMinor: ghsToMinor(raw), label: raw };
}

/** Current billing period key (YYYY-MM) in UTC. */
export function monthlyPeriod(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Add a number of months to a date and return an ISO timestamp marking the
 * end of the paid billing period. Used to compute subscription expiry.
 */
export function addMonthsIso(fromIso: string | null | undefined, months: number): string {
  const base = fromIso ? new Date(fromIso) : new Date();
  const d = new Date(base);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}

/** True when the subscription has lapsed (expired relative to now). */
export function isExpired(expiresAtIso: string | null | undefined, nowIso: string = new Date().toISOString()): boolean {
  if (!expiresAtIso) return true;
  return new Date(expiresAtIso).getTime() <= new Date(nowIso).getTime();
}

/**
 * True when the subscription has expired but is still within the grace period
 * (3 calendar days after expiry). During grace the user can log in and view
 * their dashboard (read-only) but cannot create projects, run AI, or consume
 * quotas.
 */
export function isInGracePeriod(expiresAtIso: string | null | undefined, nowIso: string = new Date().toISOString()): boolean {
  if (!expiresAtIso) return false;
  const expiresMs = new Date(expiresAtIso).getTime();
  const nowMs = new Date(nowIso).getTime();
  if (expiresMs > nowMs) return false; // not yet expired
  const elapsed = nowMs - expiresMs;
  return elapsed < GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;
}
