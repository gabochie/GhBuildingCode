import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const db = new Database("data/ghbc.db");

// Tables that had data locally but might not have been imported to D1
const TABLES_TO_CHECK = [
  "authorities", "authority_checklists", "blog_posts", "checklists", "checklist_items",
  "compliance_checks", "compliance_findings", "feature_usage", "leads", "projects",
  "audit_logs", "ai_conversations", "ai_messages", "occupancies", "rules",
  "source_citations", "search_stats", "upgrade_leads", "organizations", "memberships"
];

const OUT = path.join("migrations", "d1-seed", "missing.sql");
let content = "PRAGMA foreign_keys = OFF;\n";

for (const t of TABLES_TO_CHECK) {
  const rows = db.prepare(`SELECT * FROM "${t}"`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(", ");

  for (const row of rows) {
    const vals = columns.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      const s = String(v).replace(/'/g, "''");
      return `'${s}'`;
    });
    content += `INSERT OR IGNORE INTO "${t}" (${colList}) VALUES (${vals.join(",")});\n`;
  }
  console.log(`${t}: ${rows.length} rows`);
}

fs.writeFileSync(OUT, content);
console.log(`\nWritten to ${OUT} (${(Buffer.byteLength(content)/1024).toFixed(1)}KB)`);
db.close();
