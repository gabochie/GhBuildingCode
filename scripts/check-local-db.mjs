import Database from "better-sqlite3";
const db = new Database("data/ghbc.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
for (const t of tables) {
  const cnt = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get();
  console.log(`${t.name}: ${cnt.cnt} rows`);
}
db.close();
