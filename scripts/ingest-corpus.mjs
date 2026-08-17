#!/usr/bin/env node
/**
 * GHBC corpus ingestion — loads the BCGH-extracted GS 1207:2018 corpus into
 * SQLite. Deterministic and idempotent (drops and reloads regulatory tables).
 *
 *   node --experimental-strip-types scripts/ingest-corpus.mjs
 *
 * Env: BCGH_CORPUS (default C:\Users\user\Desktop\BCGH\ghbc-corpus),
 *      GHBC_DB_PATH (default data/ghbc.db)
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const { SCHEMA } = await import("../src/lib/db/schema.ts");
const { RULE_LIBRARY } = await import("../src/lib/rules/seed-rules.ts");
const { hashPassword } = await import("../src/lib/auth/password.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const CORPUS =
  process.env.BCGH_CORPUS || "C:\\Users\\user\\Desktop\\BCGH\\ghbc-corpus";
const DB_PATH = process.env.GHBC_DB_PATH || path.join(root, "data", "ghbc.db");

const P = (name) => path.join(CORPUS, name);
const log = (msg) => console.log(`[ingest] ${new Date().toISOString()} ${msg}`);

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA);

const REGULATION_ID = "REG-GS1207-2018";
const AUTHORITY_IDS = {
  gsa: "AUTH-GSA",
  arc: "AUTH-ARC",
  gie: "AUTH-GIE",
  gnfs: "AUTH-GNFS",
  moh: "AUTH-MOW",
  ama: "AUTH-AMA"
};

function resetRegulatoryTables() {
  db.exec("PRAGMA foreign_keys=OFF");
  for (const t of [
    "requirements_fts", "chunks_fts", "definitions_fts",
    "requirements", "requirement_conditions", "chunks", "definitions",
    "occupancies", "referenced_standards", "clauses", "sections", "parts",
    "regulations", "regulation_versions", "graph_nodes", "graph_relationships", "rules"
  ]) {
    db.exec(`DROP TABLE IF EXISTS ${t}`);
  }
  db.exec(SCHEMA);
  db.exec("PRAGMA foreign_keys=ON");
  log("regulatory tables reset");
}

function insertRegulation() {
  db.prepare(
    `INSERT OR REPLACE INTO regulations
      (id, title, authority_id, document_type, jurisdiction, publication_date,
       effective_date, version, status, copyright_status, license_status, page_count)
     VALUES (?, ?, ?, 'building_code', 'Ghana', '2018', '2018', '2018', 'active',
       'controlled_source', 'authorized_access', 1436)`
  ).run(REGULATION_ID, "Ghana Building Code (GS 1207:2018)", AUTHORITY_IDS.gsa);
  db.prepare(
    `INSERT OR REPLACE INTO regulation_versions
      (id, regulation_id, version, effective_date, status, notes)
     VALUES (?, ?, '2018', '2018', 'current', 'First published edition')`
  ).run("RV-GS1207-2018", REGULATION_ID);
  log("regulation metadata inserted");
}

function ingestHierarchy() {
  const raw = fs.readFileSync(P("json/ghana-building-code.json"), "utf8");
  const data = JSON.parse(raw);

  const insPart = db.prepare(
    "INSERT OR REPLACE INTO parts (id, part_no, title, regulation_id, description) VALUES (?, ?, ?, ?, ?)"
  );
  const insSection = db.prepare(
    "INSERT OR REPLACE INTO sections (id, part_id, section_no, title) VALUES (?, ?, ?, ?)"
  );
  const insClause = db.prepare(
    `INSERT OR REPLACE INTO clauses
       (id, clause_no, section_id, title, source_text, page_start, page_end, content_hash, verification_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'extracted')`
  );
  const secById = new Map();

  const tx = db.transaction(() => {
    for (const part of data.parts) {
      const partId = `PART-${String(part.part).padStart(2, "0")}`;
      insPart.run(partId, part.part, part.title, REGULATION_ID, null);
      if (part.sections) {
        for (const sec of part.sections) {
          const secId = `${partId}-SEC-${(sec.number || "").replace(/\s+/g, "") || "0"}`;
          secById.set(`${part.part}:${sec.number}`, secId);
          insSection.run(secId, partId, String(sec.number), sec.title);
        }
      }
    }
    let n = 0;
    for (const c of data.clauses) {
      const partId = `PART-${String(c.part).padStart(2, "0")}`;
      const secId = secById.get(`${c.part}:${c.section}`) || null;
      insClause.run(
        c.id,
        c.clause,
        secId,
        c.title || null,
        c.text,
        c.source?.page_start ?? null,
        c.source?.page_end ?? null,
        c.content_hash
      );
      n++;
    }
    log(`hierarchy: ${data.parts.length} parts, ${data.clauses.length} clauses`);
  });
  tx();
}

function ingestRequirements() {
  const insReq = db.prepare(
    `INSERT OR REPLACE INTO requirements
      (id, requirement_id, source_document, part, section, clause, clause_id, source_text,
       requirement_type, subject, condition, action, object, exceptions, parameters_json,
       references_json, confidence, verification_status, editorial_state, effective_date, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insCond = db.prepare(
    "INSERT INTO requirement_conditions (id, requirement_id, condition, variables_json) VALUES (?, ?, ?, ?)"
  );
  const insFts = db.prepare(
    "INSERT INTO requirements_fts (rowid, title, body) VALUES (?, ?, ?)"
  );

  let n = 0;
  let ft = 0;
  let condSeq = 0;
  const tx = db.transaction(() => {
    const fd = fs.openSync(P("requirements/requirements.jsonl"), "r");
    let buf = "";
    const chunkSize = 4 * 1024 * 1024;
    const rdBuf = Buffer.alloc(chunkSize);
    let size;
    let rowid = 0;
    while ((size = fs.readSync(fd, rdBuf, 0, chunkSize, null)) > 0) {
      buf += rdBuf.toString("utf8", 0, size);
      let idx;
      while ((idx = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        const r = JSON.parse(line);
        rowid++;
        const id = `rowid-${rowid}`;
        insReq.run(
          id,
          r.requirement_id,
          r.source_document,
          r.part,
          r.section,
          r.clause,
          r.clause_id,
          r.source_text,
          r.requirement_type,
          r.subject,
          r.condition,
          r.action,
          r.object,
          JSON.stringify(r.exceptions ?? []),
          JSON.stringify(r.parameters ?? []),
          JSON.stringify(r.references ?? []),
          r.confidence,
          r.verification_status,
          r.verification_status === "extracted" && (r.confidence ?? 0) >= 0.9 ? "VERIFIED" : "DRAFT",
          "2018",
          r.content_hash
        );
        for (const p of r.parameters ?? []) {
          condSeq++;
          insCond.run(`cond-${condSeq}`, id, p?.condition ?? null, JSON.stringify(p ?? {}));
        }
        insFts.run(rowid, r.requirement_type ?? "", r.source_text ?? "");
        n++;
      }
    }
    fs.closeSync(fd);
  });
  tx();
  log(`requirements: ${n} inserted (+FTS)`);
}

function ingestChunks() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO chunks
       (id, chunk_id, clause_id, text, part, section, clause, title, page, tables_json,
        requirement_ids_json, source_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insFts = db.prepare("INSERT INTO chunks_fts (rowid, body, part, section, clause) VALUES (?, ?, ?, ?, ?)");
  let n = 0;
  const tx = db.transaction(() => {
    const lines = fs.readFileSync(P("chunks/retrieval-chunks.jsonl"), "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const c = JSON.parse(line);
      n++;
      ins.run(
        `chunk-${n}`,
        c.chunk_id,
        c.clause_id,
        c.text,
        c.metadata?.part,
        c.metadata?.section,
        c.metadata?.clause,
        c.metadata?.title,
        c.metadata?.page,
        JSON.stringify(c.metadata?.tables ?? []),
        JSON.stringify(c.metadata?.requirements ?? []),
        c.source_hash
      );
      insFts.run(n, c.text ?? "", String(c.metadata?.part ?? ""), String(c.metadata?.section ?? ""), String(c.metadata?.clause ?? ""));
    }
  });
  tx();
  log(`chunks: ${n} inserted (+FTS)`);
}

function ingestDefinitions() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO definitions
       (id, term, definition, source_part, source_section, source_clause, page, content_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insFts = db.prepare("INSERT INTO definitions_fts (rowid, term, body) VALUES (?, ?, ?)");
  let n = 0;
  const tx = db.transaction(() => {
    const lines = fs.readFileSync(P("definitions/definitions.jsonl"), "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const d = JSON.parse(line);
      n++;
      ins.run(`def-${n}`, d.term, d.definition, d.source_part, d.source_section, d.source_clause, d.page, d.content_hash);
      insFts.run(n, d.term ?? "", d.definition ?? "");
    }
  });
  tx();
  log(`definitions: ${n} inserted (+FTS)`);
}

function ingestOccupancies() {
  const data = JSON.parse(fs.readFileSync(P("occupancies/occupancies.json"), "utf8"));
  const ins = db.prepare(
    `INSERT OR REPLACE INTO occupancies
       (id, group_letter, name, definition, source_part, source_section, source_clause, page, source_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const tx = db.transaction(() => {
    let i = 0;
    for (const g of data.occupancy_groups) {
      i++;
      ins.run(
        `occ-${i}`,
        g.group_letter,
        g.name,
        g.definition,
        g.source_part,
        g.source_section,
        g.source_clause,
        g.page,
        g.source_text
      );
    }
  });
  tx();
  log(`occupancies: ${data.occupancy_groups.length} inserted`);
}

function ingestStandards() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO referenced_standards
       (id, standard_code, title, issuing_body, status, relationship_to_requirement, clauses_json, pages_json, first_context)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  let n = 0;
  const tx = db.transaction(() => {
    const lines = fs.readFileSync(P("references/referenced-standards.jsonl"), "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const s = JSON.parse(line);
      n++;
      ins.run(
        `std-${n}`,
        s.standard_code,
        s.title ?? null,
        s.issuing_body ?? null,
        "referenced",
        null,
        JSON.stringify(s.clauses ?? []),
        JSON.stringify(s.pages ?? []),
        s.first_context ?? null
      );
    }
  });
  tx();
  log(`referenced standards: ${n} inserted`);
}

function ingestGraph() {
  const insN = db.prepare(
    "INSERT OR REPLACE INTO graph_nodes (id, node_type, label, ref, properties_json) VALUES (?, ?, ?, ?, ?)"
  );
  const insR = db.prepare(
    "INSERT OR REPLACE INTO graph_relationships (id, source, target, rel_type, properties_json) VALUES (?, ?, ?, ?, ?)"
  );
  let n = 0;
  let r = 0;
  const tx = db.transaction(() => {
    const lines = fs.readFileSync(P("graph/nodes.jsonl"), "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const node = JSON.parse(line);
      n++;
      insN.run(node.id, node.type ?? node.node_type, node.label ?? node.name ?? null, node.ref ?? null, JSON.stringify(node.properties ?? {}));
    }
    const relLines = fs.readFileSync(P("graph/relationships.jsonl"), "utf8").split("\n");
    for (const line of relLines) {
      if (!line.trim()) continue;
      const rel = JSON.parse(line);
      r++;
      insR.run(rel.id, rel.source, rel.target, rel.type ?? rel.rel_type, JSON.stringify(rel.properties ?? {}));
    }
  });
  tx();
  log(`graph: ${n} nodes, ${r} relationships`);
}

function seedAuthorities() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO authorities
       (id, name, jurisdiction, authority_type, website, permit_role, contact_information, tier, last_verified_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const rows = [
    [AUTHORITY_IDS.gsa, "Ghana Standards Authority", "Ghana", "standards_body", "https://www.gsa.gov.gh", "Issuer of GS 1207:2018", null, 1, null, "Primary authority — controlled regulatory source."],
    [AUTHORITY_IDS.moh, "Ministry of Works and Housing", "Ghana", "government", "https://mwh.gov.gh", "Policy and building regulation oversight", null, 1, null, "Tier 1 government authority."],
    [AUTHORITY_IDS.arc, "Architects Registration Council (ARC)", "Ghana", "professional_body", null, "Registration of architects; professional oversight", null, 2, null, "Professional authority."],
    [AUTHORITY_IDS.gie, "Ghana Institution of Engineers", "Ghana", "professional_body", null, "Professional registration and standards", null, 2, null, "Professional authority."],
    [AUTHORITY_IDS.gnfs, "Ghana National Fire Service", "Ghana", "fire_authority", "https://www.gnfs.gov.gh", "Fire certificate and life-safety review", null, 2, null, "Fire and life safety approval."],
    [AUTHORITY_IDS.ama, "Accra Metropolitan Assembly", "Accra, Greater Accra", "local_assembly", "https://ama.gov.gh", "Building permit issuance", "P.O. Box 1417, Accra", 3, null, "Local assembly — permit process, fees and checklists."],
    ["AUTH-MMDA-TEMPLATE", "Local Assembly (template)", "Ghana", "local_assembly", null, "Building permit issuance", null, 3, null, "Template profile applied to assemblies without published specifics."]
  ];
  const tx = db.transaction(() => {
    for (const r of rows) ins.run(...r);
    for (let i = 1; i <= 16; i++) {
      const name = [
        "Kumasi Metropolitan Assembly", "Tema Metropolitan Assembly", "Tamale Metropolitan Assembly",
        "Sekondi-Takoradi Metropolitan Assembly", "Cape Coast Metropolitan Assembly", "Ho Municipal Assembly",
        "Wa Municipal Assembly", "Bolgatanga Municipal Assembly", "Sunyani Municipal Assembly", "Koforidua Municipal Assembly",
        "Techiman Municipal Assembly", "Tarkwa-Nsuaem Municipal Assembly", "Dormaa Municipal Assembly",
        "Ga West Municipal Assembly", "La Dade-Kotopon Municipal Assembly", "Gushiegu Municipal Assembly"
      ][i - 1];
      ins.run(
        `AUTH-MMDA-${String(i).padStart(3, "0")}`, name, "Ghana", "local_assembly", null,
        "Building permit issuance", null, 3, null, "Local assembly — verify local checklists and fees."
      );
    }
  });
  tx();
  log("authorities seeded");
}

function seedAssemblyChecklists() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO authority_checklists (id, authority_id, category, item, required, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const common = [
    ["Land/title", "Land title documentation", 1, "Proof of ownership / title certificate."],
    ["Land/title", "Search report", 1, "Official land search documentation."],
    ["Architecture", "Site / block plan", 1, "Site layout showing setbacks and boundaries."],
    ["Architecture", "Floor plans", 1, "All storeys, dimensioned."],
    ["Architecture", "Elevations", 1, "All elevations."],
    ["Architecture", "Sections", 1, "Building sections."],
    ["Architecture", "Schedules", 1, "Door/window/finish schedules."],
    ["Structure", "Structural drawings", 1, "Signed/sealed by registered engineer."],
    ["Structure", "Structural calculations", 1, "Verified calculations."],
    ["Structure", "Soil / geotechnical report", 1, "Where required."],
    ["Fire", "Fire report", 1, "Per GNFS requirements."],
    ["MEP", "Electrical drawings", 1, "As applicable."],
    ["MEP", "Mechanical drawings", 1, "As applicable."],
    ["MEP", "Plumbing drawings", 1, "As applicable."],
    ["Environment", "EPA requirements", 0, "Where applicable."],
    ["Planning", "Zoning compliance", 1, "Planning scheme conformity."],
    ["Professional", "Professional signatures and seals", 1, "Architect + engineer sign-off."]
  ];
  const tx = db.transaction(() => {
    let i = 0;
    for (const [cat, item, req, notes] of common) {
      i++;
      ins.run(`achk-ama-${i}`, AUTHORITY_IDS.ama, cat, item, req, notes);
    }
    for (const [cat, item, req, notes] of common) {
      i++;
      ins.run(`achk-gen-${i}`, "AUTH-MMDA-TEMPLATE", cat, item, req, notes);
    }
  });
  tx();
  log("assembly checklists seeded (AMA + template)");
}

function seedRules() {
  const ins = db.prepare(
    `INSERT OR REPLACE INTO rules
       (id, rule_id, name, description, source_reference, conditions_json, input_variables_json,
        calculation_json, output_json, severity, explanation, effective_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?, ?, ?, '2018', 1)`
  );
  const tx = db.transaction(() => {
    for (const rule of RULE_LIBRARY) {
      ins.run(
        `rule-${rule.rule_id}`,
        rule.rule_id,
        rule.name,
        rule.description,
        rule.source_reference,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.input_variables),
        JSON.stringify(rule.outputs),
        rule.outputs[0]?.severity,
        rule.source_verified ? "Source verified from extracted GS 1207:2018 text." : "Threshold/coverage needs verification."
      );
    }
  });
  tx();
  log(`rules: ${RULE_LIBRARY.length} seeded`);
}

async function seedAdmin() {
  const email = (process.env.GHBC_ADMIN_EMAIL || "admin@ghbc.gabochie.com").toLowerCase();
  const password = process.env.GHBC_ADMIN_PASSWORD || "ChangeMe123!";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (!existing) {
    const hash = await hashPassword(password);
    db.prepare(
      "INSERT INTO users (id, email, password_hash, name, role, plan) VALUES (?, ?, ?, 'GHBC Admin', 'admin', 'enterprise')"
    ).run(`usr-admin`, email, hash);
    log(`admin user created: ${email}`);
  } else {
    log(`admin user exists: ${email}`);
  }
}

function writeManifest() {
  const counts = {};
  for (const t of ["parts", "sections", "clauses", "requirements", "chunks", "definitions", "occupancies", "referenced_standards", "graph_nodes", "graph_relationships", "rules", "authorities", "authority_checklists"]) {
    counts[t] = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
  }
  const manifest = {
    generated_at: new Date().toISOString(),
    corpus_hash: createHash("sha256").update(fs.readFileSync(P("requirements/requirements.jsonl"))).digest("hex").slice(0, 16),
    counts
  };
  fs.mkdirSync(path.join(root, "data"), { recursive: true });
  fs.writeFileSync(path.join(root, "data", "ingest-manifest.json"), JSON.stringify(manifest, null, 2));
  log("manifest written: " + JSON.stringify(counts));
}

try {
  resetRegulatoryTables();
  insertRegulation();
  ingestHierarchy();
  ingestRequirements();
  ingestChunks();
  ingestDefinitions();
  ingestOccupancies();
  ingestStandards();
  ingestGraph();
  seedAuthorities();
  seedAssemblyChecklists();
  seedRules();
  await seedAdmin();
  writeManifest();
  log("DONE");
} finally {
  db.close();
}
