import { z } from "zod";
import { requireAdmin, ok, badRequest, handleError } from "@/lib/api";
import { getDb, uid, now } from "@/lib/db";

const schema = z.object({
  role: z.enum(["user", "admin"])
});

/**
 * Super-admin role management. Grants or revokes the `admin` role for a user.
 * Guarded so the last remaining admin cannot demote themselves — the platform
 * can never be left without a super admin.
 */
export async function POST(req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const session = await requireAdmin();
  try {
    const { userId } = await ctx.params;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid payload.");

    const db = await getDb();
    const user = (await db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(userId)) as
      | { id: string; email: string; name: string; role: string }
      | undefined;
    if (!user) return badRequest("User not found.");

    const nextRole = parsed.data.role;

    // Last-admin guard: block demoting the only remaining admin.
    if (nextRole === "user" && user.role === "admin") {
      const admins = ((await db.prepare("SELECT COUNT(*) c FROM users WHERE role = 'admin'").get()) as { c: number }).c;
      if (admins <= 1) {
        return badRequest("Cannot remove the last admin. Promote another user first.");
      }
    }

    await db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(nextRole, now(), user.id);
    await db
      .prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'set_role', 'user', ?, ?)")
      .run(uid("aud"), session.sub, user.id, JSON.stringify({ role: nextRole, admin_email: session.email }));

    return ok({ user_id: user.id, email: user.email, role: nextRole });
  } catch (e) {
    return handleError(e);
  }
}
