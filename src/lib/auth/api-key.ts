import { createHash, randomBytes } from "node:crypto";
import { getDb, uid, now, parseJson } from "@/lib/db";

export function generateApiKey(name: string): { key: string; keyHash: string } {
  const key = `ghbc_live_${randomBytes(24).toString("hex")}`;
  return { key, keyHash: hashKey(key) };
}

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function isApiKeyFormat(key: string): boolean {
  return key.startsWith("ghbc_live_");
}

export async function authenticateAgent(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !isApiKeyFormat(token)) return null;
  const db = await getDb();
  const keyHash = hashKey(token);
  const row = (await db.prepare("SELECT * FROM api_keys WHERE key_hash = ? AND status = 'active'").get(keyHash)) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  await db.prepare("UPDATE api_keys SET last_used_at = ? WHERE id = ?").run(now(), row.id);
  return row;
}

export async function logUsage(opts: {
  apiKeyId?: string;
  userId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  requestId: string;
}) {
  const db = await getDb();
  await db.prepare(
    "INSERT INTO usage_events (id, api_key_id, user_id, endpoint, method, status_code, latency_ms, request_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    uid("use"), opts.apiKeyId ?? null, opts.userId ?? null, opts.endpoint, opts.method,
    opts.statusCode, opts.latencyMs, opts.requestId, now()
  );
}

export function scopesOf(row: Record<string, unknown>): string[] {
  return parseJson<string[]>(String(row.scopes_json ?? "[]"), []);
}
