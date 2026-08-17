import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join("migrations", "d1-seed");
const db = new Database("data/ghbc.db");

const SKIP = new Set(["_cf_KV"]);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all()
  .map(r => r.name).filter(n => !SKIP.has(n));

// For each table, export only if it has data, using individual inserts
for (const t of tables) {
  const rows = db.prepare(`SELECT * FROM "${t}"`).all();
  if (rows.length === 0) { console.log(`${t}: 0 rows (skipped)`); continue; }

  const columns = Object.keys(rows[0]);
  const colList = columns.map(c => `"${c}"`).join(", ");
  const stmts = [];

  for (const row of rows) {
    const vals = columns.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      const s = String(v).replace(/'/g, "''");
      return `'${s}'`;
    });
    stmts.push(`INSERT OR IGNORE INTO "${t}" (${colList}) VALUES (${vals.join(",")});`);
  }

  // Write one file per table (individual inserts)
  const fname = `tbl-${t}.sql`;
  const content = "PRAGMA foreign_keys = OFF;\n" + stmts.join("\n") + "\n";
  fs.writeFileSync(path.join(OUT_DIR, fname), content);
  console.log(`${t}: ${rows.length} rows -> ${fname} (${(Buffer.byteLength(content)/1024).toFixed(1)}KB)`);
}

db.close();
