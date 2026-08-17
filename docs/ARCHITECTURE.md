# GHBC Architecture

GHBC — **Ghana Building Compliance Intelligence**. The AI-powered compliance
intelligence layer for building design and construction in Ghana.

Production: https://ghbc.gabochie.com

## System context

```
Internet
  │  HTTPS
  ▼
DNS/CDN  (Cloudflare, ghbc.gabochie.com)
  │
  ▼
Next.js application server  (Node, single deployable)
  │  ├── UI (React Server Components + Tailwind + shadcn-style components)
  │  └── /api/v1/*  (REST + agent API, software-agnostic)
  │
  ├── SQLite (WAL)  ─ persistence + FTS5 keyword search + provenance store
  ├── Data layer    ─ deterministic rules engine (separate from LLM)
  ├── Retrieval     ─ clause-anchored chunks + metadata filters
  └── AI provider abstraction (OpenAI/OpenRouter-compatible HTTP)
        └── ENV keys only; never hard-coded, degrades to deterministic answers
```

## Design principles (per MASTER BUILD PROMPT)

1. **Never invent a requirement.** Every answer distinguishes
   SOURCE REQUIREMENT / INTERPRETATION / PROJECT APPLICATION / PROFESSIONAL REVIEW.
2. **Deterministic first.** The LLM is never the calculator. A TypeScript rules
   engine computes applicability, thresholds, and compliance states from the
   seeded, VERIFIED requirement corpus.
3. **Three layers (hybrid AI):**
   - Layer 1 — deterministic rules (calculations, thresholds, conditions, checklists)
   - Layer 2 — retrieval (regulatory text, definitions, provenance)
   - Layer 3 — LLM (explanation, summarization, conversation)
4. **Provenance everywhere.** Every clause/requirement carries
   Document → Part → Section → Clause → Page → source text.
5. **Editorial control.** Only `VERIFIED` requirements power production results.
   DRAFT/REVIEW/VERIFIED/SUPERSEDED/REJECTED states; versioning never overwrites.
6. **Tenant isolation.** Projects/documents are scoped to users/organizations.
   Never expose one customer's data to another.

## Runtime / data notes

- **SQLite** chosen for the MVP to avoid infrastructure that is not yet running
  locally (Docker daemon stopped; no Postgres). The data layer is repository-
  shaped so PostgreSQL + pgvector is a drop-in replacement.
- **Vector search**: corpus `embeddings.jsonl` currently has `embedding: null`, so
  V1 retrieval uses FTS5 keyword + metadata hybrid search with deterministic
  scoring. The retrieval interface is embedding-ready (see `src/lib/ai/retrieval.ts`).
- **Storage**: uploaded documents stored under `data/uploads` (S3-compatible
  adapter planned). Local disk adapter implemented for V1.

## Modules (MVP scope)

- A — AI Copilot (RAG + citations + confidence)
- B — Code Explorer (38-part taxonomy browser)
- C — Regulatory Source Library (authorities, tiers)
- D — Project wizard + compliance profile
- E — Rules engine + compliance matrix
- F — Document upload + preliminary review findings
- G — Permit readiness + assembly intelligence
- H — Report generator (PDF)
- I — Admin dashboard (editorial workflow)
- J — Public API v1 + agent API

## Repo layout

```
docs/            architecture, schema, API spec, strategy, ingestion, roadmap
scripts/         corpus ingestion + seed (Node, deterministic)
src/app/         App Router pages + /api/v1 route handlers
src/lib/         db, auth, ai (provider+retrieval+citations), rules, registry
src/components/  UI primitives + feature components
data/            runtime SQLite DB + uploads (gitignored)
tests/           regulatory test suite (node:test)
```

## Deployment

- Node server (Dockerfile included), reverse-proxied through Cloudflare DNS.
- `NEXT_PUBLIC_*` none required; all secrets via server env vars.
- Env vars: see `.env.example`.
