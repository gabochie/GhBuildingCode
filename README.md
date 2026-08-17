# GHBC — Ghana Building Compliance Intelligence

Source-backed compliance intelligence for the Ghana Building Code (GS 1207:2018).
Understand the requirements, check a project against them, find what's missing, and
track the documents an approving authority will expect.

> **Disclaimer:** GHBC output is interpretation and intelligence, not an official
> determination, and not a substitute for professional advice or a building permit.

## Stack

- **Next.js 15 (TypeScript + Tailwind v4)** — full-stack monolith serving the UI and a
  software-agnostic REST API (`/api/v1/*`).
- **SQLite (better-sqlite3)** — persistence + FTS5 keyword search, WAL mode.
- **Deterministic rules engine** (Layer 1) → **FTS5 retrieval** (Layer 2) → **LLM**
  (Layer 3, optional). The LLM is never the calculator; every answer carries
  provenance to source clauses with confidence and safety flags.
- Corpus (38 parts, 27,130 requirements, 614 definitions, 64 occupancies) is ingested
  from `C:\Users\user\Desktop\BCGH\ghbc-corpus` (override with `BCGH_CORPUS`).

## Quickstart

```bash
npm install
cp .env.example .env        # set AUTH_SECRET (>=16 chars), optional AI keys
npm run ingest              # build + seed data/ghbc.db (idempotent)
npm run dev                 # http://localhost:3000
```

Seeded admin: `admin@ghbc.gabochie.com` / `ChangeMe123!` (override via `GHBC_ADMIN_EMAIL`,
`GHBC_ADMIN_PASSWORD` — **change in production**).

Demo accounts (created by `npm run seed:users` with generated passwords, printed to the
terminal): `demo@ghbc.gabochie.com`, `pro@ghbc.gabochie.com`, `team@ghbc.gabochie.com`.

The signup form at `/register` includes a **Generate** button that produces a strong
password (CSPRNG, one of each character class), reveals it, and offers copy-to-clipboard.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Node test runner (`tests/`) |
| `npm run ingest` | Ingest corpus + seed rules/authorities/admin (idempotent) |
| `npm run seed:users` | Create demo users with generated passwords (prints credentials) |

## Environment

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | JWT signing secret (≥16 chars). **Required.** |
| `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` | OpenAI-compatible provider (e.g. OpenRouter). Leave `AI_API_KEY` empty to use the deterministic fallback. |
| `GHBC_ADMIN_EMAIL` / `GHBC_ADMIN_PASSWORD` | Bootstrap admin credentials |
| `BCGH_CORPUS` | Path to the processed corpus |
| `APP_URL` | Canonical URL (used for redirects) |
| `GHBC_DB_PATH` | Optional DB path override |

## Key routes

- `/login` `/register` — accounts
- `/dashboard` `/projects` — workspace
- `/code` — code explorer + full-text search
- `/compliance` — ad-hoc agent check
- `/permit` — authority document checklists
- `/documents` — upload plans/drawings, preliminary feature review
- `/copilot` — Q&A with citations, confidence and safety flags
- `/reports` — PDF compliance report
- `/api` — API keys + endpoint reference

Agent API: `Authorization: Bearer ghbc_live_…` → `/api/v1/agent/compliance-check`,
`/api/v1/agent/capabilities`, `/api/v1/ai/ask`, `/api/v1/search`.

## Deployment

```bash
docker build -t ghbc .
docker run -d -p 3000:3000 -v ghbc-data:/app/data -e AUTH_SECRET=... -e APP_URL=https://ghbc.gabochie.com ghbc
```

Run behind Cloudflare for `ghbc.gabochie.com`. Volume-mount `/app/data` so `ghbc.db`
and uploads persist. Switch to PostgreSQL+pgvector when the data layer is repository-
swapped (see `docs/ARCHITECTURE.md`).

## Documentation

`docs/ARCHITECTURE.md`, `docs/DATABASE_SCHEMA.md`, `docs/API_SPEC.md`,
`docs/REGULATORY_SOURCE_STRATEGY.md`, `docs/INGESTION_PIPELINE.md`, `docs/ROADMAP.md`.

## Regulatory sourcing

GS 1207:2018 is a controlled source. GHBC supports licensed/authorized/public material
only, always with provenance; it never fabricates requirements. Requirements default to
`NOT VERIFIED` until confirmed by editorial review against the source, and non-verified
sources never power PASS/FAIL determinations.
