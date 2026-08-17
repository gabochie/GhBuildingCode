export const SCHEMA = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  owner_user_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  location_region TEXT,
  location_district TEXT,
  location_assembly TEXT,
  project_type TEXT,
  occupancy TEXT,
  floors INTEGER,
  building_height REAL,
  floor_area REAL,
  site_area REAL,
  occupants INTEGER,
  structural_system TEXT,
  basement INTEGER,
  roof_type TEXT,
  special_conditions TEXT DEFAULT '[]',
  authority_id TEXT,
  readiness_score REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_characteristics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  key TEXT NOT NULL,
  value TEXT,
  source TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  mime TEXT,
  size INTEGER,
  storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  doc_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS document_pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  page_no INTEGER,
  text TEXT,
  ocr_text TEXT
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  chunk_index INTEGER,
  text TEXT
);

CREATE TABLE IF NOT EXISTS regulations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authority_id TEXT,
  document_type TEXT,
  jurisdiction TEXT,
  publication_date TEXT,
  effective_date TEXT,
  version TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source_url TEXT,
  copyright_status TEXT,
  license_status TEXT,
  supersedes TEXT,
  superseded_by TEXT,
  content_hash TEXT,
  page_count INTEGER
);

CREATE TABLE IF NOT EXISTS regulation_versions (
  id TEXT PRIMARY KEY,
  regulation_id TEXT NOT NULL REFERENCES regulations(id),
  version TEXT,
  effective_date TEXT,
  status TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  part_no INTEGER NOT NULL,
  title TEXT,
  regulation_id TEXT REFERENCES regulations(id),
  description TEXT
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  part_id TEXT NOT NULL REFERENCES parts(id),
  section_no TEXT,
  title TEXT
);

CREATE TABLE IF NOT EXISTS clauses (
  id TEXT PRIMARY KEY,
  clause_no TEXT,
  section_id TEXT REFERENCES sections(id),
  title TEXT,
  source_text TEXT,
  page_start INTEGER,
  page_end INTEGER,
  content_hash TEXT,
  verification_status TEXT DEFAULT 'requires_review'
);

CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  requirement_id TEXT UNIQUE NOT NULL,
  source_document TEXT,
  part INTEGER,
  section TEXT,
  clause TEXT,
  clause_id TEXT,
  source_text TEXT,
  requirement_type TEXT,
  subject TEXT,
  condition TEXT,
  action TEXT,
  object TEXT,
  exceptions TEXT DEFAULT '[]',
  parameters_json TEXT DEFAULT '[]',
  references_json TEXT DEFAULT '[]',
  confidence REAL,
  verification_status TEXT DEFAULT 'requires_review',
  editorial_state TEXT NOT NULL DEFAULT 'DRAFT',
  effective_date TEXT,
  content_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS requirement_conditions (
  id TEXT PRIMARY KEY,
  requirement_id TEXT NOT NULL REFERENCES requirements(id),
  condition TEXT,
  variables_json TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  chunk_id TEXT UNIQUE NOT NULL,
  clause_id TEXT,
  text TEXT,
  part INTEGER,
  section TEXT,
  clause TEXT,
  title TEXT,
  page INTEGER,
  tables_json TEXT DEFAULT '[]',
  requirement_ids_json TEXT DEFAULT '[]',
  source_hash TEXT
);

CREATE TABLE IF NOT EXISTS definitions (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT,
  source_part INTEGER,
  source_section TEXT,
  source_clause TEXT,
  page INTEGER,
  content_hash TEXT
);

CREATE TABLE IF NOT EXISTS occupancies (
  id TEXT PRIMARY KEY,
  group_letter TEXT,
  name TEXT,
  definition TEXT,
  source_part INTEGER,
  source_section TEXT,
  source_clause TEXT,
  page INTEGER,
  source_text TEXT
);

CREATE TABLE IF NOT EXISTS referenced_standards (
  id TEXT PRIMARY KEY,
  standard_code TEXT,
  title TEXT,
  issuing_body TEXT,
  status TEXT,
  relationship_to_requirement TEXT,
  clauses_json TEXT DEFAULT '[]',
  pages_json TEXT DEFAULT '[]',
  first_context TEXT
);

CREATE TABLE IF NOT EXISTS authorities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jurisdiction TEXT,
  authority_type TEXT,
  website TEXT,
  permit_role TEXT,
  contact_information TEXT,
  tier INTEGER,
  last_verified_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS authority_requirements (
  id TEXT PRIMARY KEY,
  authority_id TEXT NOT NULL REFERENCES authorities(id),
  requirement_id TEXT,
  applicability TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS authority_checklists (
  id TEXT PRIMARY KEY,
  authority_id TEXT NOT NULL REFERENCES authorities(id),
  category TEXT,
  item TEXT,
  required INTEGER DEFAULT 1,
  source_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  rule_id TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  source_reference TEXT,
  conditions_json TEXT DEFAULT '{}',
  input_variables_json TEXT DEFAULT '[]',
  calculation_json TEXT DEFAULT '{}',
  output_json TEXT DEFAULT '{}',
  severity TEXT,
  explanation TEXT,
  effective_date TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS compliance_checks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'completed',
  summary_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compliance_findings (
  id TEXT PRIMARY KEY,
  check_id TEXT REFERENCES compliance_checks(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  requirement_id TEXT,
  status TEXT,
  severity TEXT,
  confidence REAL,
  issue TEXT,
  reason TEXT,
  recommended_action TEXT,
  source_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checklists (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  authority_id TEXT,
  title TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  checklist_id TEXT NOT NULL REFERENCES checklists(id),
  category TEXT,
  item TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT REFERENCES users(id),
  kind TEXT,
  storage_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT REFERENCES projects(id),
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES ai_conversations(id),
  role TEXT NOT NULL,
  content TEXT,
  citations_json TEXT DEFAULT '[]',
  confidence REAL,
  safety_flag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_citations (
  id TEXT PRIMARY KEY,
  message_id TEXT REFERENCES ai_messages(id),
  requirement_id TEXT,
  clause_id TEXT,
  source_document TEXT,
  part INTEGER,
  section TEXT,
  clause TEXT,
  page INTEGER,
  snippet TEXT,
  status TEXT DEFAULT 'needs_verification'
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT REFERENCES organizations(id),
  user_id TEXT REFERENCES users(id),
  name TEXT,
  key_hash TEXT NOT NULL,
  scopes_json TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  api_key_id TEXT REFERENCES api_keys(id),
  user_id TEXT,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  latency_ms INTEGER,
  request_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  details_json TEXT DEFAULT '{}',
  ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS search_stats (
  id TEXT PRIMARY KEY,
  query TEXT,
  hits INTEGER,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feature_usage (
  user_id TEXT NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,
  period TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, feature, period)
);

CREATE TABLE IF NOT EXISTS upgrade_leads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  email TEXT NOT NULL,
  name TEXT,
  organization TEXT,
  phone TEXT,
  requested_plan TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  source TEXT NOT NULL DEFAULT 'form',
  channel TEXT NOT NULL DEFAULT 'web',
  interest TEXT,
  message TEXT,
  voice_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'article',
  tags TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  author_name TEXT NOT NULL DEFAULT 'GHBC Team',
  author_bio TEXT,
  meta_description TEXT,
  author_user_id TEXT REFERENCES users(id),
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS graph_nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT,
  label TEXT,
  ref TEXT,
  properties_json TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS graph_relationships (
  id TEXT PRIMARY KEY,
  source TEXT,
  target TEXT,
  rel_type TEXT,
  properties_json TEXT DEFAULT '{}'
);

CREATE VIRTUAL TABLE IF NOT EXISTS requirements_fts USING fts5(
  title,
  body,
  content=''
);

CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  body,
  part,
  section,
  clause,
  content=''
);

CREATE VIRTUAL TABLE IF NOT EXISTS definitions_fts USING fts5(
  term,
  body,
  content=''
);
`;

// Columns added after initial release — safe to ignore "duplicate column" errors
const MIGRATIONS = [
  "ALTER TABLE blog_posts ADD COLUMN author_bio TEXT",
  "ALTER TABLE blog_posts ADD COLUMN meta_description TEXT",
];

export function runMigrations(db: { exec: (sql: string) => void }) {
  for (const sql of MIGRATIONS) {
    try { db.exec(sql); } catch { /* column already exists */ }
  }
}
