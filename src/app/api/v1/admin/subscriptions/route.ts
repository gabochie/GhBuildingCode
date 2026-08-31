import { requireAdmin, ok, handleError } from "@/lib/api";
import { getDb } from "@/lib/db";

/** Admin view of subscriptions and recent payments for the dashboard. */
export async function GET() {
  try {
    await requireAdmin();
    const db = await getDb();
    const subscriptions = (await db
      .prepare(
        `SELECT s.id, s.user_id, u.email, u.name, s.plan, s.status, s.gateway, s.current_period_start, s.current_period_end, s.updated_at
         FROM subscriptions s
         JOIN users u ON u.id = s.user_id
         ORDER BY s.current_period_end DESC
         LIMIT 200`
      )
      .all()) as Array<Record<string, unknown>>;
    const payments = (await db
      .prepare(
        `SELECT p.id, p.user_id, u.email, p.reference, p.plan, p.currency, p.amount_major, p.gateway, p.gateway_ref, p.status, p.created_at
         FROM payments p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC
         LIMIT 200`
      )
      .all()) as Array<Record<string, unknown>>;
    return ok({ subscriptions, payments });
  } catch (e) {
    return handleError(e);
  }
}
