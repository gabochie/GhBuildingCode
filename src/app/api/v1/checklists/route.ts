import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, created, unauthorized, badRequest, forbidden, notFound, handleError } from "@/lib/api";

const CATEGORIES = [
  "Land/title",
  "Architecture",
  "Structure",
  "Fire",
  "MEP",
  "Environment",
  "Planning",
  "Professional"
];

const postSchema = z.object({
  project_id: z.string().min(1),
  authority_id: z.string().min(1).optional()
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const db = getDb();
    const checklists = projectId
      ? db.prepare("SELECT * FROM checklists WHERE project_id = ? ORDER BY created_at DESC").all(projectId)
      : db.prepare("SELECT * FROM checklists WHERE project_id IN (SELECT id FROM projects WHERE user_id = ?) ORDER BY created_at DESC").all(session.sub);
    return ok({ checklists });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input.");
    const { project_id: projectId, authority_id: authorityId } = parsed.data;

    const db = getDb();
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(projectId, session.sub) as
      | Record<string, unknown>
      | undefined;
    if (!project) return forbidden("Project not found or not yours.");

    // Authority-specific checklist if provided, else generic categories.
    const checklistId = uid("cl");
    db.prepare("INSERT INTO checklists (id, project_id, authority_id, title, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)").run(
      checklistId,
      projectId,
      authorityId || null,
      `Permit Readiness — ${project.name || "Project"}`,
      now()
    );

    const insItem = db.prepare("INSERT INTO checklist_items (id, checklist_id, category, item, status, notes) VALUES (?, ?, ?, ?, 'pending', ?)");

    if (authorityId) {
      const items = db.prepare("SELECT category, item, notes FROM authority_checklists WHERE authority_id = ?").all(authorityId) as Array<Record<string, unknown>>;
      if (items.length) {
        for (const it of items) {
          insItem.run(uid("ci"), checklistId, String(it.category), String(it.item), String(it.notes ?? ""));
        }
      } else {
        for (const cat of CATEGORIES) insItem.run(uid("ci"), checklistId, cat, `${cat} — verify authority requirements`, "Verify with the reviewing authority.");
      }
    } else {
      for (const cat of CATEGORIES) insItem.run(uid("ci"), checklistId, cat, `${cat} — compile required documentation`, "Verify against authority checklist.");
    }

    const items = db.prepare("SELECT * FROM checklist_items WHERE checklist_id = ?").all(checklistId) as unknown[];
    return created({ checklist: { id: checklistId, project_id: projectId, authority_id: authorityId || null, title: `Permit Readiness — ${project.name || "Project"}` }, items });
  } catch (e) {
    return handleError(e);
  }
}
