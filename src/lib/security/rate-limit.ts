import { getDb } from "@/lib/db";

/**
 * Distributed fixed-window rate limiter backed by D1 (or better-sqlite3 in
 * local dev). Using a database table — rather than an in-memory Map — keeps
 * counters correct across multiple Cloudflare Worker isolates/instances.
 *
 * Atomicity comes from a single conditional `INSERT ... ON CONFLICT ...
 * WHERE count < ?` statement, so concurrent requests cannot overshoot the
 * limit.
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Unix ms when the current window started. */
  windowStart: number;
  /** Count after this request (when allowed), or the current count (when blocked). */
  count: number;
  /** Number of requests still permitted in the current window; 0 when blocked. */
  remaining: number;
  /** Unix ms when the current window resets. */
  retryAfter: number;
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const NAMED_LIMITS: Record<string, RateLimitConfig> = {
  login: { limit: 10, windowMs: 60_000 }, // 10 login attempts / minute
  register: { limit: 5, windowMs: 3_600_000 }, // 5 registrations / hour
  forgot: { limit: 5, windowMs: 900_000 }, // 5 password-reset requests / 15 min
  ask: { limit: 30, windowMs: 60_000 }, // 30 AI questions / minute (defense in depth)
  email: { limit: 10, windowMs: 3_600_000 } // generic email-triggering action / hour
};

export function bucketStart(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs) * windowMs;
}

/**
 * Attempt to consume one unit from a named limit keyed by `key`.
 * Returns whether the request is allowed, along with window metadata.
 */
export async function rateLimit(
  name: keyof typeof NAMED_LIMITS | string,
  key: string
): Promise<RateLimitResult> {
  const cfg = NAMED_LIMITS[name] ?? NAMED_LIMITS.login;
  const db = await getDb();
  const nowMs = Date.now();
  const start = bucketStart(nowMs, cfg.windowMs);
  const fullKey = `${name}:${key}`;

  const result = await db
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
       WHERE count < ?`
    )
    .run(fullKey, start, cfg.limit);

  if (result.changes > 0) {
    const remaining = Math.max(0, cfg.limit - 1);
    return {
      allowed: true,
      windowStart: start,
      count: 1,
      remaining,
      retryAfter: start + cfg.windowMs
    };
  }

  // Limit reached: report the current count from the row.
  const row = (await db
    .prepare("SELECT count FROM rate_limits WHERE key = ? AND window_start = ?")
    .get(fullKey, start)) as { count: number } | null;

  const count = row?.count ?? cfg.limit;
  return {
    allowed: false,
    windowStart: start,
    count,
    remaining: 0,
    retryAfter: start + cfg.windowMs
  };
}

/** Attach a `Retry-After` header value (seconds) to a 429 style response. */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const seconds = Math.max(0, Math.ceil((r.retryAfter - Date.now()) / 1000));
  return {
    "Retry-After": String(seconds),
    "X-RateLimit-Limit": String(0),
    "X-RateLimit-Remaining": String(r.remaining)
  };
}

/** Best-effort cleanup of stale buckets older than `maxAgeMs` (default 24h). */
export async function pruneRateLimits(maxAgeMs = 86_400_000): Promise<void> {
  try {
    const db = await getDb();
    const cutoff = bucketStart(Date.now() - maxAgeMs, maxAgeMs);
    await db.prepare("DELETE FROM rate_limits WHERE window_start < ?").run(cutoff);
  } catch {
    // Non-fatal; pruning is best-effort.
  }
}
