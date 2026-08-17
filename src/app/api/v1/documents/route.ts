import fs from "node:fs";
import path from "node:path";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { extractText, preliminaryReview } from "@/lib/documents/extract";
import { ok, created, unauthorized, badRequest, forbidden, limitReached, handleError } from "@/lib/api";
import { checkLimit } from "@/lib/billing/plans";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const db = getDb();
    const docs = projectId
      ? db.prepare("SELECT * FROM documents WHERE user_id = ? AND project_id = ? ORDER BY created_at DESC").all(session.sub, projectId)
      : db.prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC").all(session.sub);
    return ok({ documents: docs });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const projectId = String(form.get("project_id") || "");
    const docType = String(form.get("doc_type") || "general");

    if (!file) return badRequest("No file provided.");
    if (!projectId) return badRequest("project_id is required.");
    if (file.size > 15 * 1024 * 1024) return badRequest("File exceeds 15 MB limit.");

    const db = getDb();
    const project = db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?").get(projectId, session.sub);
    if (!project) return forbidden("Project not found or not yours.");

    const chk = checkLimit(session.sub, session.plan, "documents");
    if (!chk.allowed) return limitReached("documents", chk.used, chk.limit, session.plan);

    const allowed = new Set(["application/pdf", "text/plain", "text/markdown", "application/json", "application/octet-stream"]);
    if (!allowed.has(file.type) && !file.name.match(/\.(pdf|txt|md|json)$/i)) {
      return badRequest("Unsupported file type. PDF, TXT, MD and JSON are accepted.");
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const id = uid("doc");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${id}-${safeName}`;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, storageKey), buf);

    db.prepare(
      "INSERT INTO documents (id, project_id, user_id, filename, mime, size, storage_key, status, doc_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'uploaded', ?, ?)"
    ).run(id, projectId, session.sub, file.name, file.type, file.size, storageKey, docType, now());

    db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'upload', 'document', ?, ?)").run(
      uid("aud"), session.sub, id, JSON.stringify({ filename: file.name })
    );

    return created({ document: { id, filename: file.name, mime: file.type, size: file.size, status: "uploaded", doc_type: docType } });
  } catch (e) {
    return handleError(e);
  }
}
