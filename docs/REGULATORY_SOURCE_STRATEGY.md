# Regulatory Source Strategy

## Legal boundary (MASTER BUILD PROMPT §2)

GHBC never blindly redistributes copyrighted Ghana Standards Authority material.
GS 1207:2018 and referenced standards are **controlled regulatory source material**.
The system supports only:

- licensed/authorized source documents
- legally obtained customer-provided documents
- official public regulatory material and government legislation
- public planning documents and official assembly publications
- properly attributed summaries and extracted rules

Every regulatory statement preserves **provenance**. Requirements are never
invented; AI interpretation is never presented as an official ruling.

## Source tiers (S7)

- **Tier 1 — Primary authority**: Ghana Standards Authority, Government of Ghana,
  Ministry of Works/Housing, legislation, official regulatory agencies, assemblies.
- **Tier 2 — Professional authorities**: Architects Registration Council (ARC),
  Ghana Institution of Engineers, Ghana National Fire Service (GNFS), professional bodies.
- **Tier 3 — Local authority**: individual assemblies (AMA, MMDAs).

Each `authorities` row carries jurisdiction, permit_role, website, contact info,
`last_verified_date`, and its own regulatory profile + published checklists.

## Seed content (S38 — MVP)

1. **GS 1207:2018 metadata** + 38-part taxonomy (already extracted in `BCGH` corpus).
2. **Extracted requirements** (27,130) with clause provenance. All ingested at
   `verification_status=requires_review` / `editorial_state=DRAFT` by default;
   a curated subset is elevated to VERIFIED (powering production results).
3. **Definitions** (614), **occupancies** (64), **referenced standards** (124),
   **tables** (616), **knowledge graph**.
4. **Authorities** seed: GSA, ARC, GIE, GNFS, Ministry of Works/Housing, AMA, and
   a template for the 261 local assemblies.

## Editorial workflow (S27/S28)

Editorial states: `DRAFT → REVIEW → VERIFIED → SUPERSEDED | REJECTED`.
Only VERIFIED powers production compliance. Version control never overwrites:
new version → old version flagged SUPERSEDED BY. System can answer
*"what was applicable when this project was designed?"* via effective dates.

## Provenance citation (S18)

Every AI answer includes: Document, Part, Section, Clause, Authority,
Source status (Verified / Needs verification) + the disclaimer
*"GHBC interpretation — not an official determination by the issuing authority."*
Multi-source answers show all sources.

## Hallucination controls (S36)

- low confidence → `REVIEW REQUIRED`
- source unavailable → `SOURCE NOT VERIFIED`
- conflicting sources → `REGULATORY CONFLICT DETECTED` (both sources displayed)
- never manufacture section numbers, dimensions, legal requirements, standards.
