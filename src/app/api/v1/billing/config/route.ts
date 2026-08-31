import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, withCache } from "@/lib/api";
import { enabledGateways } from "@/lib/billing/payments/config";
import { PLANS, PLAN_ORDER, planPrice } from "@/lib/billing/plans";

/** Public-safe billing configuration: gateway labels + GHS prices. No secrets. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  const gateways = enabledGateways().map((g) => ({
    id: g.id,
    label: g.label
  }));
  const plans = PLAN_ORDER.filter((id) => planPrice(id)).map((id) => ({
    id,
    name: PLANS[id].name,
    price: planPrice(id)
  }));
  return withCache(ok({ gateways, plans }), { seconds: 60, sMaxAge: 60, stale: 300 });
}
