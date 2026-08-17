import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PLANS } from "@/lib/billing/plans";
import { ok, badRequest, unauthorized, forbidden, handleError } from "@/lib/api";

const schema = z.object({
  user_id: z.string().min(1),
  plan: z.string().min(1)
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  if (session.role !== "admin") return forbidden("Admins only.");
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid payload.");
    const planId = parsed.data.plan.toLowerCase();
    if (!PLANS[planId]) return badRequest("Unknown plan.");

    const db = getDb();
    const user = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(parsed.data.user_id) as
      | { id: string; email: string; name: string }
      | undefined;
    if (!user) return badRequest("User not found.");

    db.prepare("UPDATE users SET plan = ?, updated_at = ? WHERE id = ?").run(planId, now(), user.id);
    db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'set_plan', 'user', ?, ?)").run(
      uid("aud"), session.sub, user.id, JSON.stringify({ plan: planId })
    );

    return ok({ user_id: user.id, email: user.email, plan: planId });
  } catch (e) {
    return handleError(e);
  }
}
