import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PLANS } from "@/lib/billing/plans";
import { ok, badRequest, unauthorized, handleError } from "@/lib/api";

const schema = z.object({
  plan: z.string().min(1),
  organization: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  message: z.string().max(2000).optional()
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid upgrade request.");
    const planId = parsed.data.plan.toLowerCase();
    if (!PLANS[planId]) return badRequest("Unknown plan.");

    const db = await getDb();
    const id = uid("lead");
    await db.prepare(
      "INSERT INTO upgrade_leads (id, user_id, email, name, organization, phone, requested_plan, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)"
    ).run(
      id,
      session.sub,
      session.email,
      session.name,
      parsed.data.organization ?? null,
      parsed.data.phone ?? null,
      planId,
      parsed.data.message ?? null,
      now()
    );

    await db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'request_upgrade', 'upgrade_lead', ?, ?)").run(
      uid("aud"), session.sub, id, JSON.stringify({ plan: planId })
    );

    return ok({
      lead_id: id,
      requested_plan: planId,
      message: `Your request for the ${PLANS[planId].name} plan has been received. Our team will contact you at ${session.email} to activate it.`
    });
  } catch (e) {
    return handleError(e);
  }
}
