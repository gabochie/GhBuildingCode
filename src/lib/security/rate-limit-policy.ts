/**
 * Rate-limit policy constants and pure helpers.
 * Kept free of any DB/network dependency so it can be unit-tested directly.
 */

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const NAMED_LIMITS: Record<string, RateLimitConfig> = {
  login: { limit: 10, windowMs: 60_000 }, // 10 login attempts / minute
  register: { limit: 5, windowMs: 3_600_000 }, // 5 registrations / hour
  forgot: { limit: 5, windowMs: 900_000 }, // 5 password-reset requests / 15 min
  ask: { limit: 30, windowMs: 60_000 }, // 30 AI questions / minute (defense in depth)
  email: { limit: 10, windowMs: 3_600_000 }, // generic email-triggering action / hour
  leads: { limit: 10, windowMs: 3_600_000 }, // 10 public lead submissions / hour / IP
  search: { limit: 60, windowMs: 60_000 }, // 60 public searches / minute / IP
  voice: { limit: 30, windowMs: 60_000 }, // 30 Twilio voice turns / minute / IP
  agent: { limit: 120, windowMs: 60_000 } // 120 agent API calls / minute / key
};

export function bucketStart(nowMs: number, windowMs: number): number {
  return Math.floor(nowMs / windowMs) * windowMs;
}

export function rateLimitConfig(name: string): RateLimitConfig {
  return NAMED_LIMITS[name] ?? NAMED_LIMITS.login;
}
