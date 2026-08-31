# Implementation Roadmap

Status: **PHASE 1 in progress** (docs, scaffold, DB, auth, design system, landing, dashboard).

## PHASE 1 — Foundation ✅/🚧
- [x] Repository + architecture docs
- [ ] Scaffold Next.js + TS + Tailwind
- [ ] SQLite schema + data layer
- [x] Auth — Clerk (SSO + email/password, RBAC; legacy in-house JWT/bcrypt retired)
- [ ] Design system (shadcn-style primitives)
- [ ] Landing page + Dashboard

## PHASE 2 — Regulatory core
- [ ] Corpus ingestion (regulations, requirements, chunks, FTS5)
- [ ] Metadata + provenance everywhere
- [ ] Hybrid search (keyword + metadata filters)
- [ ] Code Explorer (38-part taxonomy browser)

## PHASE 3 — AI Copilot
- [ ] Provider abstraction (OpenAI/OpenRouter-compatible)
- [ ] RAG retrieval
- [ ] Citation engine + confidence scoring
- [ ] Source verification + hallucination controls

## PHASE 4 — Project compliance
- [ ] Project wizard (8 steps)
- [ ] Rules engine (deterministic, threshold-gated)
- [ ] Compliance profile + matrix
- [ ] Missing-information + findings

## PHASE 5 — Documents
- [ ] Upload + storage
- [ ] Text extraction
- [ ] Preliminary drawing/document review findings

## PHASE 6 — Permit readiness
- [ ] Authority database + assembly checklists
- [ ] Permit readiness checker
- [ ] PDF report generator

## PHASE 7 — API
- [ ] Public REST API + API keys + usage tracking
- [ ] Agent compliance-check + capabilities
- [ ] Developer documentation

## Definition of done (S52)
production auth, responsive UI, DB persistence, source-backed AI, regulatory
provenance, project management, compliance workflow, document upload, report
generation, audit logs, error handling, security controls, automated tests,
deployment config, env config, documentation.
