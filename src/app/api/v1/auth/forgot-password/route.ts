import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { ok, badRequest, handleError } from "@/lib/api";
import { randomBytes } from "node:crypto";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";

const schema = z.object({ email: z.string().min(3).max(255) });

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Please provide a valid email address.");

    const email = parsed.data.email.trim().toLowerCase();
    const db = getDb();
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;

    // Always return success to prevent email enumeration
    if (!user) {
      return ok({ message: "If an account with that email exists, a reset link has been sent." });
    }

    // Invalidate any existing unused tokens for this user
    db.prepare("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0").run(user.id);

    // Create new token (expires in 1 hour)
    const token = generateToken();
    const id = uid("rst");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(
      "INSERT INTO password_resets (id, user_id, token, expires_at, used) VALUES (?, ?, ?, ?, 0)"
    ).run(id, user.id, token, expiresAt);

    // Send reset email via Brevo
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password/${token}`;
    const { subject, html, text } = passwordResetEmailHtml(resetUrl);

    const emailResult = await sendEmail({ to: email, subject, html, text });

    if (!emailResult.success) {
      console.error("[password-reset] email failed:", emailResult.error);
    }

    return ok({
      message: "If an account with that email exists, a reset link has been sent.",
      // Dev-only: include the URL in the response so it can be tested without email
      ...(process.env.NODE_ENV !== "production" && { _dev_reset_url: resetUrl })
    });
  } catch (e) {
    return handleError(e);
  }
}
