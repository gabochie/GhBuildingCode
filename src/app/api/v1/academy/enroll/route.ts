import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, created, badRequest, notFound, unauthorized, handleError } from "@/lib/api";
import { newId } from "@/lib/academy";
import { rateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { clientIp, tooManyRequests } from "@/lib/api";

const schema = z.object({ certification_slug: z.string().min(1).max(80) });

/**
 * POST /api/v1/academy/enroll
 * Idempotently enroll the signed-in user in a certification. Paid
 * certifications require an active non-free plan; the free cert is always
 * available. (Upgrade is confirmed via billing — see docs/ACADEMY_PLAN.md.)
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const rl = await rateLimit("academy_enroll", session.sub);
    if (!rl.allowed) return tooManyRequests("Too many requests. Please try again shortly.", rateLimitHeaders(rl));

    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid input.");

    const db = await getDb();
    const cert = (await db
      .prepare("SELECT id, slug, is_free FROM certifications WHERE slug = ?")
      .get(parsed.data.certification_slug)) as { id: string; slug: string; is_free: number } | undefined;
    if (!cert) return notFound("Certification not found");

    if (!cert.is_free && session.plan === "free") {
      return badRequest("This certification requires a paid plan. Upgrade to enroll.");
    }

    const existing = (await db
      .prepare("SELECT id FROM academy_enrollments WHERE user_id = ? AND certification_id = ?")
      .get(session.sub, cert.id)) as { id: string } | undefined;
    if (existing) return ok({ enrollment_id: existing.id, enrolled: true, created: false });

    const enrollmentId = newId("enr");
    await db
      .prepare("INSERT INTO academy_enrollments (id, user_id, certification_id, status) VALUES (?, ?, ?, 'active')")
      .run(enrollmentId, session.sub, cert.id);

    return created({ enrollment_id: enrollmentId, enrolled: true, created: true });
  } catch (e) {
    return handleError(e);
  }
}
