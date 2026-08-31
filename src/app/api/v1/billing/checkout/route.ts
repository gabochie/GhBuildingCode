import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, forbidden, handleError } from "@/lib/api";
import { getPlan, planPrice } from "@/lib/billing/plans";
import { enabledGateways } from "@/lib/billing/payments/config";
import { createPayment } from "@/lib/billing/payments/service";

const schema = z.object({
  plan: z.string().min(1),
  gateway: z.string().min(1),
  phone: z.string().max(40).optional()
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid checkout payload.");
    const planId = parsed.data.plan.toLowerCase();
    if (!getPlan(planId) || !planPrice(planId)) return badRequest("This plan cannot be purchased online.");

    const gwId = parsed.data.gateway.toLowerCase();
    const available = enabledGateways().map((g) => g.id);
    if (!available.includes(gwId as never)) return forbidden("That payment method is not available.");

    const result = await createPayment({
      userId: session.sub,
      plan: planId,
      gateway: gwId,
      firstname: (session.name || "GHBC").split(" ")[0] || "GHBC",
      lastname: (session.name || "").split(" ").slice(1).join(" ") || "Customer",
      email: session.email,
      phone: parsed.data.phone ?? "",
      baseUrl: process.env.APP_URL || "http://localhost:3000",
      description: `GHBC ${getPlan(planId).name} subscription`
    });

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
