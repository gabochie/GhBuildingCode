/**
 * Export remaining tables that failed with SQLITE_TOOBIG.
 * Uses 1 row per INSERT statement to stay under D1 limits.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join("migrations", "d1-seed");
fs.mkdirSync(OUT_DIR, { recursive: true });

const db = new Database("data/ghbc.db");

const TABLES = [
  { name: "chunks", order: 1 },
  { name: "graph_nodes", order: 2 },
  { name: "graph_relationships", order: 3 },
  { name: "requirement_conditions", order: 4 },
];

// Only export tables that are empty in D1
const EMPTY = new Set(["chunks", "graph_nodes", "graph_relationships", "requirement_conditions"]);

const MAX_FILE = 8 * 1024 * 1024;
let fileNum = 0;
let currentContent = "PRAGMA foreign_keys = OFF;\n";

function flushFile() {
  if (currentContent.trim() && currentContent.length > 30) {
    fs.writeFileSync(path.join(OUT_DIR, `remaining-${String(fileNum).padStart(3, "0")}.sql`), currentContent);
    fileNum++;
    currentContent = "PRAGMA foreign_keys = OFF;\n";
  }
}

for (const { name: tableName } of TABLES.sort((a, b) => a.order - b.order)) {
  if (!EMPTY.has(tableName)) continue;

  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  let inserted = 0;
  for (const row of rows) {
    const vals = columns.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      const s = String(v).replace(/'/g, "''");
      return `'${s}'`;
    });
    const stmt = `INSERT OR IGNORE INTO "${tableName}" (${colList}) VALUES (${vals.join(",")});`;

    if (currentContent.length + stmt.length > MAX_FILE) {
      flushFile();
    }
    currentContent += stmt + "\n";
    inserted++;
  }

  console.log(`${tableName}: ${rows.length} rows exported`);
}

flushFile();
db.close();
console.log(`\nExported to ${fileNum} files in ${OUT_DIR}/`);
