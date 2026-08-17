/**
 * Export local SQLite data to SQL files for D1 import.
 * Skips FTS virtual tables and their internal tables.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join("migrations", "d1-seed");
fs.mkdirSync(OUT_DIR, { recursive: true });

const SKIP_TABLES = new Set([
  "_cf_KV",
  "chunks_fts",
  "chunks_fts_config",
  "chunks_fts_data",
  "chunks_fts_docsize",
  "chunks_fts_idx",
  "requirements_fts",
  "requirements_fts_config",
  "requirements_fts_data",
  "requirements_fts_docsize",
  "requirements_fts_idx",
  "definitions_fts",
  "definitions_fts_config",
  "definitions_fts_data",
  "definitions_fts_docsize",
  "definitions_fts_idx",
]);

const db = new Database("data/ghbc.db");
db.pragma("journal_mode = WAL");

// Insert order: parent tables first to satisfy foreign keys
const TABLE_ORDER = [
  "users", "organizations", "regulation_versions", "regulations", "parts",
  "sections", "clauses", "requirements", "requirement_conditions", "referenced_standards",
  "definitions", "occupancies", "authorities", "authority_checklists", "authority_requirements",
  "rules", "chunks", "graph_nodes", "graph_relationships", "source_citations",
  "projects", "project_characteristics", "documents", "document_pages", "document_chunks",
  "compliance_checks", "compliance_findings", "reports", "checklists", "checklist_items",
  "memberships", "feature_usage", "search_stats", "audit_logs",
  "ai_conversations", "ai_messages", "api_keys", "password_resets",
  "leads", "upgrade_leads", "usage_events", "blog_posts",
];

const allTables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((r) => r.name)
  .filter((n) => !SKIP_TABLES.has(n));

// Sort: known tables in TABLE_ORDER first, then any remaining alphabetically
const knownSet = new Set(TABLE_ORDER);
const tables = [
  ...TABLE_ORDER.filter((n) => allTables.includes(n)),
  ...allTables.filter((n) => !knownSet.has(n)).sort(),
];

const BATCH_SIZE = 10; // rows per INSERT batch (D1 has statement size limits)
let fileIndex = 0;
let totalRows = 0;
const lines = [];

lines.push("PRAGMA foreign_keys = OFF;");

for (const tableName of tables) {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const valueRows = batch.map((row) => {
      const vals = columns.map((c) => {
        const v = row[c];
        if (v === null || v === undefined) return "NULL";
        if (typeof v === "number") return String(v);
        // Escape single quotes for SQL
        const s = String(v).replace(/'/g, "''");
        return `'${s}'`;
      });
      return `(${vals.join(",")})`;
    });

    lines.push(
      `INSERT OR IGNORE INTO "${tableName}" (${colList}) VALUES ${valueRows.join(",\n")};`
    );
    totalRows += batch.length;
  }

  console.log(`${tableName}: ${rows.length} rows`);
}

// Write to file(s)
const MAX_FILE_SIZE = 9 * 1024 * 1024; // 9MB per file (D1 limit is 10MB)
let currentContent = "";
let partNum = 0;

for (const line of lines) {
  if (currentContent.length + line.length > MAX_FILE_SIZE && currentContent.length > 100) {
    fs.writeFileSync(path.join(OUT_DIR, `seed-${String(partNum).padStart(3, "0")}.sql`), currentContent);
    partNum++;
    currentContent = "PRAGMA foreign_keys = OFF;\n";
  }
  currentContent += line + "\n";
}

if (currentContent.trim()) {
  fs.writeFileSync(path.join(OUT_DIR, `seed-${String(partNum).padStart(3, "0")}.sql`), currentContent);
  partNum++;
}

console.log(`\nExported ${totalRows} rows across ${tables.length} tables to ${partNum} files in ${OUT_DIR}/`);
db.close();
