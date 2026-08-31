import { z } from "zod";
import { requireAdmin, ok, badRequest, handleError } from "@/lib/api";
import { getDb, uid, now } from "@/lib/db";
import { getPlan } from "@/lib/billing/plans";
import { activateSubscription } from "@/lib/billing/subscriptions";

const schema = z.object({
  plan: z.string().min(1).optional(),
  months: z.number().int().min(1).max(24).default(1)
});

/**
 * Human-super-admin in the loop: renew/extend a user's paid subscription,
 * e.g. after a manual off-platform payment or a goodwill/enterprise grant.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  try {
    const { userId } = await ctx.params;
    const db = await getDb();
    const user = (await db.prepare("SELECT id, email, plan FROM users WHERE id = ?").get(userId)) as { id: string; email: string; plan: string } | undefined;
    if (!user) return badRequest("User not found.");

    const reqJson = await _req.json().catch(() => ({}));
    const parsed = schema.safeParse(reqJson);
    if (!parsed.success) return badRequest("Invalid payload.");

    const planId = parsed.data.plan ? parsed.data.plan.toLowerCase() : user.plan;
    if (!getPlan(planId)) return badRequest("Unknown plan.");

    // Create an internal payment record to trace the manual activation.
    const paymentId = uid("pay");
    await db
      .prepare(
        `INSERT INTO payments (id, user_id, reference, plan, currency, amount_major, amount_minor, gateway, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'GHS', '0', '0', 'manual', 'paid', ?, ?)`
      )
      .run(paymentId, userId, uid("ref"), planId, now(), now());

    // Extend by N months from now (manual grants do not chase prior periods).
    const sub = await activateSubscription({
      userId,
      plan: planId,
      paymentId,
      gateway: "manual",
      fromIso: now()
    });

    await db
      .prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'subscription_extended', 'user', ?, ?)")
      .run(uid("aud"), session.sub, userId, JSON.stringify({ plan: planId, months: parsed.data.months, admin_email: session.email }));

    return ok({
      user_id: userId,
      email: user.email,
      plan: sub.plan,
      current_period_end: sub.current_period_end
    });
  } catch (e) {
    return handleError(e);
  }
}
