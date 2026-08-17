import { z } from "zod";
import { getDb, now } from "@/lib/db";
import { ok, badRequest, handleError } from "@/lib/api";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid reset payload.");

    const { token, password } = parsed.data;
    const pwError = validatePasswordStrength(password);
    if (pwError) return badRequest(pwError);

    const db = getDb();
    const row = db.prepare(
      "SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?"
    ).get(token) as { id: string; user_id: string; expires_at: string; used: number } | undefined;

    if (!row) return badRequest("Invalid or expired reset link.");
    if (row.used) return badRequest("This reset link has already been used.");
    if (new Date(row.expires_at) < new Date()) return badRequest("This reset link has expired. Please request a new one.");

    const hash = await hashPassword(password);

    // Update password and invalidate token in a transaction
    const tx = db.transaction(() => {
      db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(hash, now(), row.user_id);
      db.prepare("UPDATE password_resets SET used = 1 WHERE id = ?").run(row.id);
    });
    tx();

    return ok({ message: "Your password has been reset. You can now sign in." });
  } catch (e) {
    return handleError(e);
  }
}
