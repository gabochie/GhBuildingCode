import { getDb } from "@/lib/db";
import { ok, notFound, handleError, withCache } from "@/lib/api";

/**
 * GET /api/v1/academy/certificates/[serial]
 * Public, unauthenticated verification of an issued certificate. Returns only
 * the fields needed to confirm authenticity — never the holder's user id/email.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ serial: string }> }) {
  try {
    const { serial } = await params;
    const db = await getDb();
    const row = (await db
      .prepare(
        `SELECT c.serial, c.recipient_name, c.issued_at, c.expires_at, c.revoked_at,
                c.revoke_reason, c.verify_hash, cert.title, cert.level, cert.slug
           FROM academy_certificates c
           JOIN certifications cert ON cert.id = c.certification_id
          WHERE c.serial = ?`
      )
      .get(serial)) as Record<string, unknown> | undefined;
    if (!row) return notFound("Certificate not found");

    const valid = !row.revoked_at;
    return withCache(
      ok({
        certificate: {
          serial: row.serial,
          recipient_name: row.recipient_name,
          certification: { title: row.title, level: row.level, slug: row.slug },
          issued_at: row.issued_at,
          expires_at: row.expires_at,
          revoked_at: row.revoked_at,
          revoke_reason: row.revoke_reason,
          verify_hash: row.verify_hash,
          valid
        }
      }),
      { seconds: 600 }
    );
  } catch (e) {
    return handleError(e);
  }
}
