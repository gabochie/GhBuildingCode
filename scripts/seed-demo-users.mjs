#!/usr/bin/env node
/**
 * Seed demo users with generated passwords.
 *
 *   npm run seed:users
 *
 * Creates (idempotent, never overwrites existing emails) the demo accounts and
 * prints the credentials so they can be shared with reviewers. Passwords are
 * generated via the same CSPRNG used by the signup form.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const { SCHEMA } = await import("../src/lib/db/schema.ts");
const { hashPassword } = await import("../src/lib/auth/password.ts");
const { generatePassword } = await import("../src/lib/password-gen.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const DB_PATH = process.env.GHBC_DB_PATH || path.join(root, "data", "ghbc.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA);

const DEMO_USERS = [
  { email: "demo@ghbc.gabochie.com", name: "Demo User", role: "user", plan: "free" },
  { email: "pro@ghbc.gabochie.com", name: "Pro Demo", role: "user", plan: "pro" },
  { email: "team@ghbc.gabochie.com", name: "Team Demo", role: "user", plan: "enterprise" }
];

try {
  for (const u of DEMO_USERS) {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(u.email);
    if (existing) {
      console.log(`[seed] exists (skipped): ${u.email}`);
      continue;
    }
    const password = generatePassword();
    const hash = await hashPassword(password);
    db.prepare(
      "INSERT INTO users (id, email, password_hash, name, role, plan) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(`usr-${u.role}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, u.email, hash, u.name, u.role, u.plan);
    console.log(`[seed] created: ${u.email}`);
    console.log(`        password: ${password}`);
  }
  console.log("[seed] DONE");
} finally {
  db.close();
}
