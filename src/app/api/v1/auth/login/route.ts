import { cookies } from "next/headers";
import { z } from "zod";
import { getDb, uid } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/tokens";
import { ok, badRequest, handleError, unauthorized, tooManyRequests, clientIp } from "@/lib/api";
import { rateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  email: z.string().min(3).max(255),
  password: z.string().min(1)
});

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const rl = await rateLimit("login", ip);
    if (!rl.allowed) return tooManyRequests("Too many login attempts. Please wait before trying again.", rateLimitHeaders(rl));

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid login payload.");
    const { email, password } = parsed.data;
    const normalized = email.trim().toLowerCase();

    const db = await getDb();
    const user = (await db
      .prepare("SELECT id, email, name, password_hash, role, plan FROM users WHERE email = ?")
      .get(normalized)) as
      | { id: string; email: string; name: string; password_hash: string; role: string; plan: string }
      | undefined;

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return unauthorized("Invalid email or password.");
    }

    await db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'login', 'user', ?, ?)").run(
      uid("aud"),
      user.id,
      user.id,
      JSON.stringify({ email: user.email })
    );

    const token = signSession({ sub: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan });
    (await cookies()).set("ghbc_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan } });
  } catch (e) {
    return handleError(e);
  }
}
