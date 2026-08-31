# GHBC Database Schema

Persistence: SQLite (WAL). Tables mirror the MASTER BUILD PROMPT §45 list.
PostgreSQL-ready: every table maps 1:1; `TEXT PRIMARY KEY` UUIDs keep portability.

## Tables

### Auth & organization
- `users` (id = Clerk user id, email UNIQUE, password_hash NULLABLE (Clerk users have no local password), name, role[user|admin], plan, created_at, updated_at)
- `organizations` (id, name, slug, owner_user_id, created_at)
- `memberships` (id, org_id, user_id, role[owner|admin|member], created_at)

### Projects
- `projects` (id, user_id, org_id?, name, status, location_region, location_district,
  location_assembly, project_type, occupancy, floors, building_height, floor_area,
  site_area, occupants, structural_system, basement, roof_type, special_conditions,
  authority_id, readiness_score, created_at, updated_at)
- `project_characteristics` (id, project_id, key, value, source)

### Documents
- `documents` (id, project_id, user_id, filename, mime, size, storage_key,
  status[uploaded|processing|reviewed|failed], doc_type, created_at)
- `document_pages` (id, document_id, page_no, text, ocr_text)
- `document_chunks` (id, document_id, chunk_index, text, embedding?)

### Regulatory corpus
- `regulations` (id, title, authority_id, document_type, jurisdiction, publication_date,
  effective_date, version, status[active|superseded], source_url, copyright_status,
  license_status, supersedes, superseded_by, content_hash, page_count)
- `regulation_versions` (id, regulation_id, version, effective_date, status, notes, created_at)
- `parts` (id, part_no, title, regulation_id, description)
- `sections` (id, part_id, section_no, title)
- `clauses` (id, clause_no, section_id, title, source_text, page_start, page_end,
  content_hash, verification_status)
- `requirements` (id, requirement_id, source_document, part, section, clause, clause_id,
  source_text, requirement_type, subject, condition, action, object, exceptions,
  parameters_json, references_json, confidence, verification_status[extracted|requires_review|verified],
  editorial_state[DRAFT|REVIEW|VERIFIED|SUPERSEDED|REJECTED], effective_date,
  content_hash, created_at)
- `requirement_conditions` (id, requirement_id, condition, variables_json)
- `chunks` (id, chunk_id, clause_id, text, part, section, clause, title, page,
  tables_json, requirement_ids_json, source_hash)
- `definitions` (id, term, definition, source_part, source_section, source_clause, page, content_hash)
- `occupancies` (id, group_letter, name, definition, source_part, source_section,
  source_clause, page, source_text)
- `referenced_standards` (id, standard_code, title, issuing_body, status,
  relationship_to_requirement, clauses_json, pages_json, first_context)

### Authorities
- `authorities` (id, name, jurisdiction, authority_type, website, permit_role,
  contact_information, tier[1|2|3], last_verified_date, notes)
- `authority_requirements` (id, authority_id, requirement_id, applicability, notes)
- `authority_checklists` (id, authority_id, category, item, required, source_url, notes)

### Rules engine
- `rules` (id, rule_id, name, description, source_reference, conditions_json,
  input_variables_json, calculation_json, output_json, severity, explanation,
  effective_date, active)

### Compliance
- `compliance_checks` (id, project_id, status, summary_json, created_at)
- `compliance_findings` (id, check_id, project_id, requirement_id, status[PASS|FAIL|REVIEW|NA|MISSING|NOT_VERIFIED],
  severity[CRITICAL|HIGH|MEDIUM|LOW|INFORMATION], confidence, issue, reason,
  recommended_action, source_json, created_at)
- `checklists` (id, project_id, authority_id, title, status, created_at)
- `checklist_items` (id, checklist_id, category, item, status, notes)
- `reports` (id, project_id, user_id, kind, storage_key, created_at)

### AI
- `ai_conversations` (id, user_id, project_id?, title, created_at)
- `ai_messages` (id, conversation_id, role, content, citations_json, confidence,
  safety_flag, created_at)
- `source_citations` (id, message_id, requirement_id, clause_id, source_document,
  part, section, clause, page, snippet, status[verified|needs_verification])

### Platform
- `api_keys` (id, org_id, user_id, name, key_hash, scopes_json, status, last_used_at, created_at)
- `usage_events` (id, api_key_id?, user_id?, endpoint, method, status_code, latency_ms,
  request_id, created_at)
- `audit_logs` (id, user_id?, action, entity_type, entity_id, details_json, ip, created_at)
- `search_stats` (id, query, hits, source, created_at)
- `feature_usage` (PK user_id+feature+period, count, updated_at) — monthly plan quotas
- `rate_limits` (PK key+window_start, count) — distributed fixed-window rate limiting
- `upgrade_leads` (id, user_id?, email, name, organization, phone, requested_plan, message, status, created_at)
- `leads` (id, user_id?, name, email, phone, organization, source, channel, interest, message, status, notes, created_at)
- `password_resets` (id, user_id, token UNIQUE, expires_at, used, created_at)

### Billing & content
- `blog_posts` (id, slug UNIQUE, title, excerpt, body, cover_image, category,
  tags, status[draft|published|archived], author_name, author_bio, meta_description,
  author_user_id, published_at, created_at, updated_at)
- `payments` (id, user_id, reference UNIQUE, plan, currency, amount_major,
  amount_minor, gateway[moolre|expresspay|manual], gateway_ref, status
  [pending|paid|failed|cancelled], created_at, updated_at) — online Ghana payments
- `subscriptions` (id, user_id, plan, status[active], payment_id?, gateway,
  current_period_start, current_period_end, created_at, updated_at) — one payment
  activates a plan for one billing period (1 month monthly / 12 months annual —
  the paid amount implies the period); admin renews/extends. A paid `users.plan`
  is honored only while an active subscription backs it. **Grace period:** for 3
  days after expiry the paid plan is retained so the user can log in and view
  their dashboard read-only; all quota-consuming actions (create project, run
  AI/compliance, upload docs, PDF reports) are blocked during grace.

### FTS (SQLite virtual tables)
- `requirements_fts` (content-optimized over requirement text)
- `chunks_fts` (FTS5 over chunk text)
- `definitions_fts`

## Provenance rule
Every clause/requirement carries `part → section → clause → page → source_text`,
enabling "where did this come from?" answers in seconds.
