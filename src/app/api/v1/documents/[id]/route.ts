import fs from "node:fs";
import path from "node:path";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { extractText, preliminaryReview } from "@/lib/documents/extract";
import { ok, notFound, unauthorized, forbidden, badRequest, handleError } from "@/lib/api";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = getDb();
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!doc) return notFound("Document not found");
    if (doc.user_id !== session.sub) return forbidden();
    const pages = db.prepare("SELECT page_no, text FROM document_pages WHERE document_id = ? ORDER BY page_no LIMIT 200").all(id) as unknown[];
    return ok({ document: doc, pages });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = getDb();
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!doc) return notFound("Document not found");
    if (doc.user_id !== session.sub) return forbidden();

    const storageKey = String(doc.storage_key);
    const filePath = path.join(UPLOAD_DIR, storageKey);
    if (!fs.existsSync(filePath)) return badRequest("Document file is missing from storage.");

    const buf = fs.readFileSync(filePath);
    const text = await extractText(buf, String(doc.mime || ""), String(doc.filename || ""));

    const tx = db.transaction(() => {
      db.prepare("DELETE FROM document_pages WHERE document_id = ?").run(id);
      const insPage = db.prepare("INSERT INTO document_pages (id, document_id, page_no, text) VALUES (?, ?, ?, ?)");
      const pages = splitPages(text);
      if (pages.length) {
        pages.forEach((p, i) => insPage.run(uid("pg"), id, i + 1, p));
      } else {
        insPage.run(uid("pg"), id, 1, text);
      }
      db.prepare("UPDATE documents SET status = 'reviewed' WHERE id = ?").run(id);
    });
    tx();

    const review = preliminaryReview(text);
    return ok({
      document_id: id,
      status: "reviewed",
      text_length: text.length,
      pages: splitPages(text).length || 1,
      review
    });
  } catch (e) {
    return handleError(e);
  }
}

function splitPages(text: string): string[] {
  const pages: string[] = [];
  const chunks = text.split(/\f|\n\n\n/);
  for (const c of chunks) {
    const clean = c.trim();
    if (clean) pages.push(clean);
  }
  return pages.slice(0, 500);
}
