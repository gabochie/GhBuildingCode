import Database from "better-sqlite3";
const local = new Database("data/ghbc.db");
const tables = local.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '%fts%' AND name != '_cf_KV' ORDER BY name").all().map(r => r.name);
for (const t of tables) {
  const cnt = local.prepare(`SELECT COUNT(*) as c FROM "${t}"`).get().c;
  if (cnt === 0) continue;
  console.log(`${t}: ${cnt}`);
}
local.close();
