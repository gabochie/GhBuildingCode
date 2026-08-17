/**
 * Export problematic large-column tables to smaller SQL files for D1 import.
 * Targets: chunks, graph_nodes, graph_relationships, requirement_conditions
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join("migrations", "d1-seed");
fs.mkdirSync(OUT_DIR, { recursive: true });

const db = new Database("data/ghbc.db");

const LARGE_TABLES = [
  "requirement_conditions",
  "chunks",
  "graph_nodes",
  "graph_relationships",
];

const MAX_STMT_LEN = 50000; // 50KB per INSERT statement

for (const tableName of LARGE_TABLES) {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  if (rows.length === 0) continue;

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  // Check if data is already loaded
  const cnt = db.prepare(`SELECT COUNT(*) as c FROM "${tableName}"`).get().c;

  let fileNum = 0;
  const statements = [];

  for (const row of rows) {
    const vals = columns.map((c) => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      const s = String(v).replace(/'/g, "''");
      return `'${s}'`;
    });
    statements.push(
      `INSERT OR IGNORE INTO "${tableName}" (${colList}) VALUES (${vals.join(",")});`
    );
  }

  // Group statements into files that fit under the max statement length
  let currentContent = "PRAGMA foreign_keys = OFF;\n";
  for (const stmt of statements) {
    if (currentContent.length + stmt.length > 9 * 1024 * 1024 && currentContent.length > 100) {
      const fname = `${tableName}-${String(fileNum).padStart(3, "0")}.sql`;
      fs.writeFileSync(path.join(OUT_DIR, fname), currentContent);
      fileNum++;
      currentContent = "PRAGMA foreign_keys = OFF;\n";
    }
    currentContent += stmt + "\n";
  }
  if (currentContent.trim() && currentContent.length > 20) {
    const fname = `${tableName}-${String(fileNum).padStart(3, "0")}.sql`;
    fs.writeFileSync(path.join(OUT_DIR, fname), currentContent);
    fileNum++;
  }

  console.log(`${tableName}: ${rows.length} rows -> ${fileNum} files`);
}

db.close();
console.log("Done");
