-- D1 migration 0003: support Clerk users
-- Clerk-authenticated users have no local password, so `password_hash` must be
-- nullable. SQLite cannot drop a column's NOT NULL via ALTER TABLE, so we
-- rebuild the `users` table (standard SQLite/D1 migrate pattern) with
-- `foreign_keys=OFF` to allow the rename. Data is preserved verbatim.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id, email, password_hash, name, role, plan, created_at, updated_at)
  SELECT id, email, password_hash, name, role, plan, created_at, updated_at FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

PRAGMA defer_foreign_keys = OFF;
