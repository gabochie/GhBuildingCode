import type { RetrievedRequirement } from "./retrieval";

export interface Citation {
  requirement_id: string;
  source_document: string;
  part: number;
  section: string;
  clause: string;
  page: number;
  snippet: string;
  status: "verified" | "needs_verification";
}

/**
 * Citation engine (§18). Every AI answer must carry full provenance:
 * Document / Part / Section / Clause / Authority / Source status.
 * Only VERIFIED editorial-state requirements are cited as "verified".
 */
export function buildCitations(requirements: RetrievedRequirement[]): Citation[] {
  return requirements.map((r) => ({
    requirement_id: r.requirement_id,
    source_document: r.source_document,
    part: r.part,
    section: r.section,
    clause: r.clause,
    page: r.page,
    snippet: r.source_text.slice(0, 240),
    status: r.editorial_state === "VERIFIED" ? "verified" : "needs_verification"
  }));
}

export function citationText(c: Citation): string {
  return `[${c.source_document}, Part ${c.part}${c.section ? `, §${c.section}` : ""}${c.clause ? `, ${c.clause}` : ""}${c.page ? `, p.${c.page}` : ""}]`;
}

export const CITATION_DISCLAIMER =
  "GHBC interpretation — not an official determination by the issuing authority.";
