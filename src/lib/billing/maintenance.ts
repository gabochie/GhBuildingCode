import { getDb, now, uid } from "@/lib/db";

interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  payment_id: string | null;
  gateway: string | null;
  current_period_start: string;
  current_period_end: string;
}

export interface RenewalRunResult {
  expired: number;
  dueForRenewal: number;
  remainingActive: number;
}

/**
 * Mark subscriptions past their current period as expired so the effective-plan
 * resolution falls back to Free. Idempotent: the guarded UPDATE only touches
 * rows still `active`, so re-runs never double-expire or resurrect anything.
 *
 * Returns the number of subscriptions transitioned to `expired`.
 */
export async function expireLapsedSubscriptions(): Promise<number> {
  const db = await getDb();
  const nowIso = now();
  const lapsed = (await db
    .prepare("SELECT * FROM subscriptions WHERE status = 'active' AND current_period_end <= ? ORDER BY current_period_end")
    .all(nowIso)) as unknown as SubscriptionRow[];

  let expired = 0;
  for (const s of lapsed) {
    const res = await db
      .prepare("UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ? AND status = 'active'")
      .run(nowIso, s.id);
    if (res.changes > 0) {
      expired++;
      // Audit trail (best-effort).
      await db
        .prepare(
          "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'subscription_expired', 'subscription', ?, ?)"
        )
        .run(
          uid("aud"),
          s.user_id,
          s.id,
          JSON.stringify({ plan: s.plan, period_end: s.current_period_end })
        );
    }
  }
  return expired;
}

export interface DueRenewal {
  id: string;
  user_id: string;
  email: string;
  plan: string;
  current_period_end: string;
}

/**
 * Returns currently-active subscriptions expiring within `windowDays` days so
 * admins (and/or reminders) can nudge users to renew. Does not modify state.
 */
export async function listSubscriptionsDueForRenewal(windowDays: number): Promise<DueRenewal[]> {
  const db = await getDb();
  const nowIso = now();
  const horizon = new Date(Date.now() + Math.max(1, windowDays) * 86400000).toISOString();
  return (await db
    .prepare(
      `SELECT s.id, s.user_id, u.email, s.plan, s.current_period_end
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.status = 'active' AND s.current_period_end > ? AND s.current_period_end <= ?
       ORDER BY s.current_period_end ASC`
    )
    .all(nowIso, horizon)) as unknown as DueRenewal[];
}

/**
 * Full daily maintenance sweep, used by the cron route.
 *
 *  1. Expire lapsed subscriptions.
 *  2. Collect subscriptions due for renewal within the reminder window.
 *
 * Returns a summary of what changed. No involuntary re-charging — this is
 * purely state maintenance + a renewal queue for the human super-admin.
 */
export async function runRenewalSweep(opts: { reminderWindowDays?: number } = {}): Promise<RenewalRunResult> {
  const reminderWindowDays = Math.max(1, Math.round(opts.reminderWindowDays ?? 7));
  const expired = await expireLapsedSubscriptions();
  const dueForRenewal = (await listSubscriptionsDueForRenewal(reminderWindowDays)).length;
  const db = await getDb();
  const remainingActive = ((await db
    .prepare("SELECT COUNT(*) c FROM subscriptions WHERE status = 'active'")
    .get()) as { c: number }).c;
  return { expired, dueForRenewal, remainingActive };
}
