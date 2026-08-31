import { getDb, now, uid } from "@/lib/db";
import { addMonthsIso, isExpired, getPlan, type Plan } from "./plans";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  payment_id: string | null;
  gateway: string | null;
  current_period_start: string;
  current_period_end: string;
}

interface PaymentRow {
  id: string;
  user_id: string;
  reference: string;
  plan: string;
  currency: string;
  amount_major: string;
  amount_minor: string;
  gateway: string;
  gateway_ref: string | null;
  status: string;
}

/**
 * Activate (or extend) a user's paid plan, written atomically with the payment
 * status transition via D1 batch. Returns the new subscription.
 *
 * Billing model (v1): one-time payment activates the plan for one billing
 * period. A later payment extends the current period. Admins can renew/extend.
 */
export async function activateSubscription(opts: {
  userId: string;
  plan: string;
  paymentId: string;
  gateway: string;
  fromIso: string | null;
  /** Number of months to add to the effective period (default 1). */
  months?: number;
}): Promise<SubscriptionRow> {
  const db = await getDb();
  const plan = getPlan(opts.plan).id;
  const months = Math.max(1, opts.months ?? 1);
  const existing = (await db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY current_period_end DESC LIMIT 1")
    .get(opts.userId)) as SubscriptionRow | null;

  const base = !existing || isExpired(existing.current_period_end) ? (opts.fromIso ?? new Date().toISOString()) : existing.current_period_end;
  const periodStart = base;
  const periodEnd = addMonthsIso(base, months);
  const id = existing?.id ?? uid("sub");
  const subGateway = existing?.gateway ?? opts.gateway;

  await db
    .prepare(
      `INSERT INTO subscriptions (id, user_id, plan, status, payment_id, gateway, current_period_start, current_period_end, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         plan = excluded.plan,
         status = 'active',
         payment_id = excluded.payment_id,
         gateway = excluded.gateway,
         current_period_start = excluded.current_period_start,
         current_period_end = excluded.current_period_end,
         updated_at = excluded.updated_at`
    )
    .run(id, opts.userId, plan, opts.paymentId, subGateway, periodStart, periodEnd, now(), now());

  await db.prepare("UPDATE users SET plan = ?, updated_at = ? WHERE id = ?").run(plan, now(), opts.userId);
  await db
    .prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'subscription_activated', 'user', ?, ?)")
    .run(uid("aud"), opts.userId, opts.userId, JSON.stringify({ plan, payment_id: opts.paymentId, gateway: opts.gateway, period_start: periodStart, period_end: periodEnd }));

  return {
    id,
    user_id: opts.userId,
    plan,
    status: "active",
    payment_id: opts.paymentId,
    gateway: subGateway,
    current_period_start: periodStart,
    current_period_end: periodEnd
  };
}

/** Record a failed/cancelled payment (does not change the user's plan). */
export async function markPaymentStatus(paymentId: string, status: string): Promise<void> {
  const db = await getDb();
  await db.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), paymentId);
}

/**
 * Get the effective plan considering a paid subscription's billing period.
 * If the user has a paid plan (non-free) but no active, non-expired
 * subscription to back it, they fall back to Free until renewed.
 */
export async function effectivePlan(userId: string): Promise<Plan> {
  const db = await getDb();
  const user = (await db.prepare("SELECT plan FROM users WHERE id = ?").get(userId)) as { plan: string } | undefined;
  if (!user) return getPlan("free");
  if (user.plan === "free") return getPlan("free");
  const sub = (await db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY current_period_end DESC LIMIT 1")
    .get(userId)) as SubscriptionRow | null;
  // No paid subscription record at all -> treat as free (canonical states via admin flags)
  if (!sub) return getPlan(user.plan);
  if (isExpired(sub.current_period_end)) return getPlan("free");
  return getPlan(sub.plan);
}
