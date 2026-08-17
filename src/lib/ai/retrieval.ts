import { getDb } from "@/lib/db";

export interface RetrievedRequirement {
  requirement_id: string;
  source_document: string;
  part: number;
  section: string;
  clause: string;
  source_text: string;
  requirement_type: string;
  editorial_state: string;
  confidence: number;
  page: number;
  score: number;
}

export interface RetrievedChunk {
  chunk_id: string;
  clause_id: string;
  text: string;
  part: number;
  section: string;
  clause: string;
  title: string;
  page: number;
  requirement_ids: string[];
  score: number;
}

export interface SearchOptions {
  query: string;
  part?: number | null;
  types?: string[] | null;
  limit?: number;
  verifiedOnly?: boolean;
}

/**
 * Layer 2 — Retrieval. Deterministic hybrid search over the clause-anchored
 * corpus: FTS5 keyword ranking + metadata filters (part, requirement type,
 * editorial state). Embedding-ready interface.
 */
export function searchRequirements(opts: SearchOptions): RetrievedRequirement[] {
  const db = getDb();
  const limit = opts.limit || 12;
  const q = (opts.query || "").trim();
  const terms = tokenize(q);

  if (!q || !terms.length) {
    let sql = `
      SELECT r.*, c.page_start as page,
             bm25(requirements_fts) * -1 AS score
      FROM requirements r
      LEFT JOIN requirements_fts fts ON fts.rowid = r.rowid
      LEFT JOIN clauses c ON c.id = r.clause_id
      WHERE 1=1`;
    const params: unknown[] = [];
    if (opts.part) {
      sql += " AND r.part = ?";
      params.push(opts.part);
    }
    if (opts.types?.length) {
      sql += ` AND r.requirement_type IN (${opts.types.map(() => "?").join(",")})`;
      params.push(...opts.types);
    }
    if (opts.verifiedOnly) {
      sql += " AND r.editorial_state = 'VERIFIED'";
    }
    sql += " ORDER BY r.confidence DESC LIMIT ?";
    params.push(limit);
    return (db.prepare(sql).all(...params) as RetrievedRequirement[]).map((r) => ({
      ...r,
      score: r.score ?? 0
    }));
  }

  // NOTE: requirements_fts is contentless; we maintain rowid parity by inserting
  // rows in the same order as requirements. FTS queries join back on rowid.
  const ftsQuery = terms.map((t) => `"${t}"`).join(" OR ");
  const sql = `
    SELECT r.*, c.page_start as page, bm25(requirements_fts) * -1 AS score
    FROM requirements_fts fts
    JOIN requirements r ON r.rowid = fts.rowid
    LEFT JOIN clauses c ON c.id = r.clause_id
    WHERE requirements_fts MATCH ?
      ${opts.part ? "AND r.part = ?" : ""}
      ${opts.types?.length ? `AND r.requirement_type IN (${opts.types.map(() => "?").join(",")})` : ""}
      ${opts.verifiedOnly ? "AND r.editorial_state = 'VERIFIED'" : ""}
    ORDER BY score DESC LIMIT ?`;
  const params: unknown[] = [ftsQuery];
  if (opts.part) params.push(opts.part);
  if (opts.types?.length) params.push(...opts.types);
  params.push(limit);
  return db.prepare(sql).all(...params) as RetrievedRequirement[];
}

export function searchChunks(query: string, opts: { part?: number; limit?: number } = {}): RetrievedChunk[] {
  const db = getDb();
  const limit = opts.limit || 8;
  const terms = tokenize(query);
  if (!terms.length) return [];
  const ftsQuery = terms.map((t) => `"${t}"`).join(" OR ");
  const sql = `
    SELECT c.*, bm25(chunks_fts) * -1 AS score
    FROM chunks_fts fts
    JOIN chunks c ON c.rowid = fts.rowid
    WHERE chunks_fts MATCH ?
      ${opts.part ? "AND c.part = ?" : ""}
    ORDER BY score DESC LIMIT ?`;
  const params: unknown[] = [ftsQuery];
  if (opts.part) params.push(opts.part);
  params.push(limit);
  return (db.prepare(sql).all(...params) as Array<Record<string, unknown>>).map((row) => ({
    chunk_id: row.chunk_id as string,
    clause_id: row.clause_id as string,
    text: row.text as string,
    part: row.part as number,
    section: row.section as string,
    clause: row.clause as string,
    title: row.title as string,
    page: row.page as number,
    requirement_ids: safeJson<string[]>(row.requirement_ids_json, []),
    score: (row.score as number) ?? 0
  }));
}

export function searchDefinitions(term: string): Array<{ term: string; definition: string; page: number }> {
  const db = getDb();
  const t = tokenize(term);
  if (!t.length) return [];
  const sql = `
    SELECT d.term, d.definition, d.page
    FROM definitions_fts fts
    JOIN definitions d ON d.rowid = fts.rowid
    WHERE definitions_fts MATCH ?
    ORDER BY bm25(definitions_fts) ASC LIMIT 8`;
  return db.prepare(sql).all(t.map((x) => `"${x}"`).join(" OR ")) as Array<{
    term: string;
    definition: string;
    page: number;
  }>;
}

export function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

function safeJson<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string") return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
