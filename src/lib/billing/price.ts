/**
 * Pure pricing & billing-period helpers (no DB / framework imports) so they
 * can run under the plain `node --experimental-strip-types` test runner.
 */

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

/** Resolve the GHS price for a plan id. Free/custom plans are not chargeable. */
export function planPrice(planId: string): PlanPrice | null {
  if (planId === "free") return null;
  const raw = GHS_MONTHLY[planId];
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
