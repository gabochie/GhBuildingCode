import type { BoundDB, D1Database } from "./d1";
import { createDb, now, uid, json, parseJson } from "./d1";

export type { BoundDB } from "./d1";
export { now, uid, json, parseJson } from "./d1";

/**
 * Get database instance. All methods are async — callers must use `await`.
 *
 * In Cloudflare Workers: pass D1 binding from env
 * In local dev/tests: call with no args
 */
export async function getDb(d1?: D1Database): Promise<BoundDB> {
  return createDb(d1);
}
