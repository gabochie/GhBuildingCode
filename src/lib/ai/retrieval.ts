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

export async function searchRequirements(opts: SearchOptions): Promise<RetrievedRequirement[]> {
  const db = await getDb();
  const limit = opts.limit || 12;
  const q = (opts.query || "").trim();
  const terms = tokenize(q);

  if (!q || !terms.length) {
    let sql = `
      SELECT r.*, c.page_start as page, 0 AS score
      FROM requirements r
      LEFT JOIN clauses c ON c.id = r.clause_id
      WHERE 1=1`;
    const params: unknown[] = [];
    if (opts.part) { sql += " AND r.part = ?"; params.push(opts.part); }
    if (opts.types?.length) { sql += ` AND r.requirement_type IN (${opts.types.map(() => "?").join(",")})`; params.push(...opts.types); }
    if (opts.verifiedOnly) { sql += " AND r.editorial_state = 'VERIFIED'"; }
    sql += " ORDER BY r.confidence DESC LIMIT ?";
    params.push(limit);
    return ((await db.prepare(sql).all(...params)) as unknown as RetrievedRequirement[]).map((r) => ({
      ...r,
      score: r.score ?? 0
    }));
  }

  const ftsQuery = terms.join(" AND ");
  const ftsFilters: string[] = [];
  const ftsFilterParams: unknown[] = [];
  if (opts.part) { ftsFilters.push("r.part = ?"); ftsFilterParams.push(opts.part); }
  if (opts.types?.length) { ftsFilters.push(`r.requirement_type IN (${opts.types.map(() => "?").join(",")})`); ftsFilterParams.push(...opts.types); }
  if (opts.verifiedOnly) { ftsFilters.push("r.editorial_state = 'VERIFIED'"); }

  // Prefer FTS5 (indexed full-text) — far faster than LIKE on large corpora.
  // Falls back to LIKE so DBs/seed data lacking FTS never returns empty.
  try {
    const hits = (await db
      .prepare(
        `SELECT r.*, c.page_start as page, bm25(requirements_fts) AS score
         FROM requirements_fts
         JOIN requirements r ON r.id = 'rowid-' || requirements_fts.rowid
         LEFT JOIN clauses c ON c.id = r.clause_id
         WHERE requirements_fts MATCH ?
         ${ftsFilters.length ? "AND " + ftsFilters.join(" AND ") : ""}
         ORDER BY bm25(requirements_fts) ASC LIMIT ?`
      )
      .all(ftsQuery, ...ftsFilterParams, limit)) as Array<Record<string, unknown>>;
    if (hits.length) {
      return hits.map((r) => ({
        ...(r as unknown as RetrievedRequirement),
        score: Number(r.score) || 0
      }));
    }
  } catch {
    // FTS table missing/unavailable — fall through to LIKE.
  }

  const likeClauses: string[] = [];
  const likeParams: unknown[] = [];
  for (const t of terms) {
    const pattern = `%${t}%`;
    likeClauses.push("(r.subject LIKE ? OR r.action LIKE ? OR r.source_text LIKE ?)");
    likeParams.push(pattern, pattern, pattern);
  }

  let sql = `
    SELECT r.*, c.page_start as page, 1.0 AS score
    FROM requirements r
    LEFT JOIN clauses c ON c.id = r.clause_id
    WHERE (${likeClauses.join(" AND ")})`;
  const params: unknown[] = [...likeParams];
  if (opts.part) { sql += " AND r.part = ?"; params.push(opts.part); }
  if (opts.types?.length) { sql += ` AND r.requirement_type IN (${opts.types.map(() => "?").join(",")})`; params.push(...opts.types); }
  if (opts.verifiedOnly) { sql += " AND r.editorial_state = 'VERIFIED'"; }
  sql += " ORDER BY r.confidence DESC LIMIT ?";
  params.push(limit);
  return (await db.prepare(sql).all(...params)) as unknown as RetrievedRequirement[];
}

export async function searchChunks(query: string, opts: { part?: number; limit?: number } = {}): Promise<RetrievedChunk[]> {
  const db = await getDb();
  const limit = opts.limit || 8;
  const terms = tokenize(query);
  if (!terms.length) return [];

  // FTS5 first, with LIKE fallback for consistency.
  const ftsQuery = terms.join(" AND ");
  try {
    const hits = (await db
      .prepare(
        `SELECT c.*, bm25(chunks_fts) AS score
         FROM chunks_fts
         JOIN chunks c ON c.id = 'chunk-' || chunks_fts.rowid
         WHERE chunks_fts MATCH ?
         ${opts.part ? "AND c.part = ?" : ""}
         ORDER BY bm25(chunks_fts) ASC LIMIT ?`
      )
      .all(ftsQuery, ...(opts.part !== undefined ? [opts.part] : []), limit)) as Array<Record<string, unknown>>;
    if (hits.length) return mapChunkRows(hits);
  } catch {
    // fall through to LIKE
  }

  const likeClauses: string[] = [];
  const likeParams: unknown[] = [];
  for (const t of terms) {
    const pattern = `%${t}%`;
    likeClauses.push("(c.text LIKE ? OR c.title LIKE ?)");
    likeParams.push(pattern, pattern);
  }

  const sql = `
    SELECT c.*, 1.0 AS score
    FROM chunks c
    WHERE ${likeClauses.join(" AND ")}
      ${opts.part ? "AND c.part = ?" : ""}
    ORDER BY c.rowid LIMIT ?`;
  const params: unknown[] = [...likeParams];
  if (opts.part) params.push(opts.part);
  params.push(limit);
  const rows = (await db.prepare(sql).all(...params)) as Array<Record<string, unknown>>;
  return mapChunkRows(rows);
}

function mapChunkRows(rows: Array<Record<string, unknown>>): RetrievedChunk[] {
  return rows.map((row) => ({
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

export async function searchDefinitions(term: string): Promise<Array<{ term: string; definition: string; page: number }>> {
  const db = await getDb();
  const t = tokenize(term);
  if (!t.length) return [];

  // FTS5 first, with LIKE fallback for consistency.
  const ftsQuery = t.join(" AND ");
  try {
    const hits = (await db
      .prepare(
        `SELECT d.term, d.definition, d.page
         FROM definitions_fts
         JOIN definitions d ON d.id = 'def-' || definitions_fts.rowid
         WHERE definitions_fts MATCH ?
         ORDER BY bm25(definitions_fts) ASC LIMIT 8`
      )
      .all(ftsQuery)) as Array<{ term: string; definition: string; page: number }>;
    if (hits.length) return hits;
  } catch {
    // fall through to LIKE
  }

  const likeClauses: string[] = [];
  const likeParams: unknown[] = [];
  for (const x of t) {
    const pattern = `%${x}%`;
    likeClauses.push("d.term LIKE ? OR d.definition LIKE ?");
    likeParams.push(pattern, pattern);
  }

  const sql = `
    SELECT d.term, d.definition, d.page
    FROM definitions d
    WHERE ${likeClauses.join(" AND ")}
    ORDER BY d.rowid LIMIT 8`;
  return (await db.prepare(sql).all(...likeParams)) as Array<{
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
