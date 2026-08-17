import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA, runMigrations } from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.GHBC_DB_PATH || path.join(DATA_DIR, "ghbc.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
    runMigrations(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function now(): string {
  return new Date().toISOString();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
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
