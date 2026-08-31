import { resolveWebhook } from "@/lib/billing/payments/service";

/**
 * Payment gateway webhook receiver.
 *
 * The path segment identifies the gateway (moolre | expresspay). The gateway's
 * own handler validates the request enough to identify the transaction; the
 * service then re-queries the gateway for an authoritative status before
 * activating any plan. This prevents a forged/unauthenticated POST from
 * granting a paid plan without the gateway confirming the payment.
 */
export async function POST(req: Request, ctx: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await ctx.params;
  const result = await resolveWebhook(gateway, req);
  // Gateways expect an immediate 200 on receipt (they retry otherwise).
  return new Response("ok", { status: 200 });
}
