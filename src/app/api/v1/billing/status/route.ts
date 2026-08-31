import { getSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, handleError } from "@/lib/api";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) return badRequest("Missing reference.");
    const db = await getDb();
    const payment = (await db
      .prepare(
        `SELECT id, reference, plan, currency, amount_major, gateway, gateway_ref, status, created_at
         FROM payments WHERE reference = ? AND user_id = ?`
      )
      .get(reference, session.sub)) as
      | { id: string; reference: string; plan: string; currency: string; amount_major: string; gateway: string; gateway_ref: string | null; status: string; created_at: string }
      | undefined;
    if (!payment) return badRequest("Payment not found.");
    return ok(payment);
  } catch (e) {
    return handleError(e);
  }
}
