import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, unauthorized, notFound, handleError, badRequest } from "@/lib/api";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const { id } = await ctx.params;
    if (!id) return badRequest("Missing API key id");
    const db = await getDb();
    const row = (await db
      .prepare("SELECT id, user_id, status FROM api_keys WHERE id = ?")
      .get(id)) as { id: string; user_id: string; status: string } | undefined;

    if (!row) return notFound("API key not found");
    if (row.user_id !== session.sub) return notFound("API key not found"); // avoid leaking existence

    if (row.status !== "revoked") {
      await db.prepare("UPDATE api_keys SET status = 'revoked' WHERE id = ?").run(id);
    }

    return ok({ revoked: true, id });
  } catch (e) {
    return handleError(e);
  }
}
