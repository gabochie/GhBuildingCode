# Ingestion Pipeline

Input: `BCGH` corpus (already extracted deterministically from the GS 1207:2018 PDF
using PyMuPDF + Windows OCR). This repo ingests those artifacts — it does not
re-extract the PDF.

## Corpus inputs

| Corpus file | Rows | Loads into |
|---|---|---|
| `ghbc-corpus/requirements/requirements.jsonl` | 27,130 | `requirements`, `requirement_conditions` |
| `ghbc-corpus/chunks/retrieval-chunks.jsonl` | 7,205 | `chunks`, `chunks_fts` |
| `ghbc-corpus/definitions/definitions.jsonl` | 614 | `definitions`, `definitions_fts` |
| `ghbc-corpus/occupancies/occupancies.json` | 64 | `occupancies` |
| `ghbc-corpus/references/referenced-standards.jsonl` | 124 | `referenced_standards` |
| `ghbc-corpus/markdown/part-01.md … part-38.md` | 38 | `parts`, `sections`, `clauses` |
| `ghbc-corpus/graph/nodes.jsonl + relationships.jsonl` | 15,877 / 16,932 | `graph_nodes`, `graph_relationships` |

## Steps (`npm run ingest` → `scripts/ingest-corpus.js`)

1. Resolve `BCGH_CORPUS` env (default `C:\Users\user\Desktop\BCGH\ghbc-corpus`).
2. Open SQLite (WAL), create schema.
3. Parse markdown parts → parts/sections/clauses tree with page refs.
4. Bulk-insert requirements, conditions, chunks, definitions, occupancies, standards, graph.
5. Build FTS5 indexes (`requirements_fts`, `chunks_fts`, `definitions_fts`).
6. Write `data/ingest-manifest.json` (row counts + hash) for observability.
7. Deterministic: re-running is idempotent (DELETE + reload).

## Post-ingest elevation

`scripts/seed.js` (`npm run seed`) then:
- seeds authorities (GSA, ARC, GIE, GNFS, MoW&H, AMA + template),
- marks a curated, high-confidence subset of requirements as VERIFIED
  (numeric/dimensional requirements reviewed against OCR context and safety-critical
  clauses from Parts 10 (means of escape), 9 (fire protection), 11 (accessibility)),
- seeds the deterministic **rules engine** with thresholds extracted from verified
  requirements (stair width/depth, exit travel distance, height/storey thresholds,
  accessibility triggers, occupancy classifications).
- creates the first admin account from env `GHBC_ADMIN_EMAIL/PASSWORD`.

## Verification

`tests/` run a regulatory test suite: e.g. residential + 3 storeys + Accra must
activate fire/life-safety and accessibility requirements; stair-width thresholds;
version/editorial-state gating; tenant isolation; hallucination resistance
(unverifiable question → "could not verify").
