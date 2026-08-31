import { z } from "zod";
import { getDb, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { generateApiKey } from "@/lib/auth/api-key";
import { ok, created, unauthorized, badRequest, limitReached, handleError } from "@/lib/api";
import { checkLimit } from "@/lib/billing/plans";

const schema = z.object({
  name: z.string().min(2).max(80),
  scopes: z.array(z.string()).default(["compliance:check", "search"])
});

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const db = await getDb();
    const keys = (await db
      .prepare("SELECT id, name, scopes_json, status, last_used_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC")
      .all(session.sub)) as unknown[];
    return ok({ keys });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid API key payload.");
    const db = await getDb();
    const chk = await checkLimit(session.sub, session.plan, "apiKeys");
    if (!chk.allowed) return limitReached("api keys", chk.used, chk.limit, session.plan, undefined, chk.gracePeriod);

    const { key, keyHash } = generateApiKey(parsed.data.name);
    await db.prepare("INSERT INTO api_keys (id, user_id, name, key_hash, scopes_json, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)").run(
      `ak-${Date.now().toString(36)}`, session.sub, parsed.data.name, keyHash, JSON.stringify(parsed.data.scopes), now()
    );
    return created({
      key, // shown once
      warning: "Store this key securely. It will not be shown again."
    });
  } catch (e) {
    return handleError(e);
  }
}
