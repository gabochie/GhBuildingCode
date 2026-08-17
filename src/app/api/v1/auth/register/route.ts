import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { hashPassword, validateEmail, validatePasswordStrength } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/tokens";
import { badRequest, created, handleError } from "@/lib/api";

const bodySchema = z.object({
  email: z.string().min(3).max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120)
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid registration payload.");
    const { email, password, name } = parsed.data;
    const normalized = email.trim().toLowerCase();

    if (!validateEmail(normalized)) return badRequest("Invalid email address.");
    const pwError = validatePasswordStrength(password);
    if (pwError) return badRequest(pwError);

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
    if (existing) return badRequest("An account with this email already exists.");

    const id = uid("usr");
    const hash = await hashPassword(password);
    db.prepare("INSERT INTO users (id, email, password_hash, name, role, plan) VALUES (?, ?, ?, ?, 'user', 'free')").run(
      id,
      normalized,
      hash,
      name.trim()
    );
    db.prepare(
      "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'register', 'user', ?, ?)"
    ).run(uid("aud"), id, id, JSON.stringify({ email: normalized }));

    const token = signSession({ sub: id, email: normalized, name: name.trim(), role: "user", plan: "free" });
    (await cookies()).set("ghbc_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return created({ user: { id, email: normalized, name: name.trim(), role: "user", plan: "free" } });
  } catch (e) {
    return handleError(e);
  }
}
