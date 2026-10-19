import { getDb, now, uid } from "@/lib/db";
import { planPrice, type BillingPeriod } from "@/lib/billing/plans";
import { gatewayById } from "./registry";
import type { PaymentStatus } from "./gateway";
import { activateSubscription } from "@/lib/billing/subscriptions";

export interface CreatePaymentInput {
  userId: string;
  plan: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  gateway: string;
  baseUrl: string;
  description?: string;
  /** Months the plan will be active for once paid (1=monthly, 12=annual). */
  months?: number;
}

export interface CreatePaymentResult {
  payment_id: string;
  reference: string;
  gateway: string;
  redirectUrl: string | null;
  message: string | null;
}

/**
 * Create a pending payment row and initiate it with the chosen gateway.
 * Returns a redirect URL (ExpressPay) or a MoMo instruction (Moolre).
 */
export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const gw = gatewayById(input.gateway);
  if (!gw) throw new Error("UNKNOWN_GATEWAY");
  if (!gw.isEnabled()) throw new Error("GATEWAY_NOT_CONFIGURED");

  const months = Math.max(1, input.months ?? 1);
  const period: BillingPeriod = months >= 12 ? "annual" : "monthly";
  const price = planPrice(input.plan, period);
  if (!price) throw new Error("PLAN_NOT_PAYABLE");

  const db = await getDb();
  const reference = `${uid("pay").replace("pay_", "")}`;
  const paymentId = uid("pay");
  const description = input.description ?? `GHBC ${input.plan} subscription (${period})`;
  const callbackPath = gw.webhookPath;
  const callbackUrl = new URL(callbackPath, input.baseUrl).toString();
  const redirectUrl = new URL("/app/upgrade?status=return", input.baseUrl).toString();

  await db
    .prepare(
      `INSERT INTO payments (id, user_id, reference, plan, currency, amount_major, amount_minor, gateway, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'GHS', ?, ?, ?, 'pending', ?, ?)`
    )
    .run(paymentId, input.userId, reference, input.plan, price.label, price.amountMinor, input.gateway, now(), now());

  const initiated = await gw.initiate({
    reference,
    amountMajor: price.amountMinor,
    amountMinor: price.amountMinor,
    firstname: input.firstname,
    lastname: input.lastname,
    email: input.email,
    phone: input.phone,
    description,
    callbackUrl,
    redirectUrl
  });

  if (initiated.gatewayRef) {
    await db.prepare("UPDATE payments SET gateway_ref = ?, updated_at = ? WHERE id = ?").run(initiated.gatewayRef, now(), paymentId);
  }

  await db
    .prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'payment_initiated', 'payment', ?, ?)")
    .run(uid("aud"), input.userId, paymentId, JSON.stringify({ gateway: input.gateway, plan: input.plan, reference }));

  return {
    payment_id: paymentId,
    reference,
    gateway: input.gateway,
    redirectUrl: initiated.redirectUrl,
    message: initiated.message ?? null
  };
}

export interface ResolveResult {
  handled: boolean;
  status?: PaymentStatus;
}

/**
 * Handle a gateway webhook idempotently. The gateway only hands us enough to
 * identify the transaction; we re-query the gateway for an authoritative
 * status, then atomically transition the payment and (on success) activate the
 * plan subscription exactly once.
 */
export async function resolveWebhook(gatewayId: string, req: Request): Promise<{ valid: boolean; event?: unknown }> {
  const gw = gatewayById(gatewayId);
  if (!gw) return { valid: false };
  if (!gw.isEnabled()) return { valid: false };
  const event = await gw.handleWebhook(req);
  if (!event) return { valid: false };

  const db = await getDb();
  const payment = (await db
    .prepare("SELECT id, user_id, plan, status, gateway_ref, amount_minor FROM payments WHERE reference = ?")
    .get(event.reference)) as { id: string; user_id: string; plan: string; status: string; gateway_ref: string | null; amount_minor: string } | undefined;
  if (!payment) return { valid: true, event }; // unknown reference — ignore silently

  // Authoritative re-query: the gateway's own verify() is the source of truth.
  // Fail closed — if we cannot reach the gateway we do NOT trust the
  // webhook-reported status (a forged "paid" would otherwise activate a plan
  // during any gateway-unreachable window). The gateway will retry.
  let status: PaymentStatus;
  let verifiedAmount: string | null = null;
  try {
    const verified = await gw.verify({ reference: event.reference, gatewayRef: event.gatewayRef ?? payment.gateway_ref });
    status = verified.status;
    verifiedAmount = verified.amountMinor ?? null;
  } catch {
    return { valid: true, event }; // unverifiable — leave payment untouched
  }

  // Amount check: if the gateway reports an amount it must match what we
  // charged, otherwise treat the notification as fraudulent.
  if (status === "paid" && verifiedAmount !== null && verifiedAmount !== "") {
    const reported = Number(verifiedAmount);
    const expected = Number(payment.amount_minor);
    if (Number.isFinite(reported) && Number.isFinite(expected) && Math.abs(reported - expected) > 1) {
      return { valid: true, event }; // amount mismatch — do not activate
    }
  }

  // Idempotency: only transition once.
  if (payment.status === "pending" && status === "paid") {
    // Derive the billing period from the stored amount: if it matches the
    // plan's annual price the user paid for 12 months, otherwise 1 month.
    // This requires no schema change and works for existing payment rows.
    const annualPrice = planPrice(payment.plan, "annual");
    const months = annualPrice && annualPrice.amountMinor === payment.amount_minor ? 12 : 1;
    await activateSubscription({
      userId: payment.user_id,
      plan: payment.plan,
      paymentId: payment.id,
      gateway: gatewayId,
      fromIso: now(),
      months
    });
    await db.prepare("UPDATE payments SET status = 'paid', gateway_ref = ?, updated_at = ? WHERE id = ?").run(event.gatewayRef ?? payment.gateway_ref, now(), payment.id);
  } else if (payment.status === "pending" && (status === "failed" || status === "cancelled")) {
    await db.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").run(status, now(), payment.id);
  }

  return { valid: true, event };
}
