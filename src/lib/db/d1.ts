/**
 * Database abstraction layer.
 * - Local dev: uses better-sqlite3 (synchronous internally, wrapped in promises)
 * - Cloudflare: uses D1 (async edge database)
 *
 * All methods are async — callers must use `await`.
 * API matches better-sqlite3 patterns to minimize migration churn.
 */

import { randomUUID } from "node:crypto";

/** Cloudflare D1 database binding — minimal type declaration */
export interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  exec(sql: string): Promise<{ success: boolean }>;
  batch(stmts: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: { duration: number } }>;
  run(): Promise<{ success: boolean; meta: { rows_written: number } }>;
}

interface D1Result {
  results: unknown[];
  success: boolean;
  meta: { duration: number };
}

export interface BoundDB {
  prepare(sql: string): BoundStatement;
  exec(sql: string): Promise<void>;
}

export interface BoundStatement {
  get(...params: unknown[]): Promise<Record<string, unknown> | null>;
  all(...params: unknown[]): Promise<Record<string, unknown>[]>;
  run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid: number }>;
}

// ---------- better-sqlite3 adapter (local dev) ----------

class LocalStatement implements BoundStatement {
  constructor(
    private getDb: () => any,
    private sql: string
  ) {}

  async get(...params: unknown[]) {
    return this.getDb().prepare(this.sql).get(...params) as Record<string, unknown> | null;
  }

  async all(...params: unknown[]) {
    return this.getDb().prepare(this.sql).all(...params) as Record<string, unknown>[];
  }

  async run(...params: unknown[]) {
    const info = this.getDb().prepare(this.sql).run(...params);
    return { changes: info?.changes ?? 0, lastInsertRowid: 0 };
  }
}

class LocalDB implements BoundDB {
  constructor(private getSqlite: () => any) {}

  prepare(sql: string) {
    return new LocalStatement(() => this.getSqlite(), sql);
  }

  async exec(sql: string) {
    this.getSqlite().exec(sql);
  }
}

// ---------- D1 adapter (Cloudflare) ----------

class D1Statement implements BoundStatement {
  constructor(private d1: D1Database, private sql: string) {}

  async get(...params: unknown[]) {
    const stmt = params.length ? this.d1.prepare(this.sql).bind(...params) : this.d1.prepare(this.sql);
    return (await stmt.first()) as Record<string, unknown> | null;
  }

  async all(...params: unknown[]) {
    const stmt = params.length ? this.d1.prepare(this.sql).bind(...params) : this.d1.prepare(this.sql);
    const result = await stmt.all();
    return (result.results ?? []) as Record<string, unknown>[];
  }

  async run(...params: unknown[]) {
    const stmt = params.length ? this.d1.prepare(this.sql).bind(...params) : this.d1.prepare(this.sql);
    const result = await stmt.run();
    return { changes: result.meta?.rows_written ?? 0, lastInsertRowid: 0 };
  }
}

class D1DB implements BoundDB {
  constructor(private d1: D1Database) {}

  prepare(sql: string) {
    return new D1Statement(this.d1, sql);
  }

  async exec(sql: string) {
    await this.d1.exec(sql);
  }
}

// ---------- Factory ----------

let localDb: LocalDB | null = null;

/**
 * Create a BoundDB instance.
 * - In Cloudflare Workers: pass D1 binding from env
 * - In local dev/tests: call with no args (uses better-sqlite3)
 *
 * All methods are async — callers must use `await`.
 */
export async function createDb(d1?: D1Database): Promise<BoundDB> {
  // Explicit D1 binding passed in
  if (d1) {
    return new D1DB(d1);
  }

  // Auto-detect D1 binding via OpenNext's getCloudflareContext (Cloudflare Workers / preview)
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const envD1 = (ctx.env as Record<string, unknown>).DB;
    if (envD1 && typeof envD1 === "object" && "prepare" in (envD1 as Record<string, unknown>)) {
      return new D1DB(envD1 as D1Database);
    }
  } catch {
    // Not in OpenNext environment — fall through to local DB
  }

  // Fallback: check process.env directly (wrangler dev injects bindings here)
  const envD1 = (process.env as Record<string, unknown>).DB;
  if (envD1 && typeof envD1 === "object" && "prepare" in (envD1 as Record<string, unknown>)) {
    return new D1DB(envD1 as D1Database);
  }

  if (!localDb) {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const Database = (await import("better-sqlite3")).default;

    const DATA_DIR = path.join(process.cwd(), "data");
    const DB_PATH = process.env.GHBC_DB_PATH || path.join(DATA_DIR, "ghbc.db");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    // Apply the full schema (idempotent `IF NOT EXISTS`) on local init so
    // existing dev databases pick up new tables/indexes without re-seeding.
    const { SCHEMA } = await import("./schema");
    sqlite.exec(SCHEMA);

    localDb = new LocalDB(() => sqlite);
  }

  return localDb;
}

// ---------- Helpers ----------

export function now(): string {
  return new Date().toISOString();
}

export function uid(prefix = "id"): string {
  const rand = randomUUID().replace(/-/g, "").slice(0, 12);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function json(v: unknown): string {
  return JSON.stringify(v ?? null);
}

export function parseJson<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
