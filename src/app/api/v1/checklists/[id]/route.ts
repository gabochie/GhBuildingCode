import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, notFound, unauthorized, forbidden, badRequest, handleError } from "@/lib/api";

const patchSchema = z.object({
  item_id: z.string().min(1),
  status: z.enum(["pending", "complete", "na", "review"])
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = await getDb();
    const checklist = (await db.prepare("SELECT * FROM checklists WHERE id = ?").get(id)) as Record<string, unknown> | undefined;
    if (!checklist) return notFound("Checklist not found");
    const project = (await db.prepare("SELECT user_id FROM projects WHERE id = ?").get(checklist.project_id)) as { user_id: string } | undefined;
    if (!project || project.user_id !== session.sub) return forbidden();
    const items = (await db.prepare("SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY category").all(id)) as unknown[];
    return ok({ checklist, items });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Invalid input.");
    const { item_id: itemId, status } = parsed.data;
    const db = await getDb();
    const checklist = (await db.prepare("SELECT * FROM checklists WHERE id = ?").get(id)) as Record<string, unknown> | undefined;
    if (!checklist) return notFound("Checklist not found");
    const project = (await db.prepare("SELECT user_id FROM projects WHERE id = ?").get(checklist.project_id)) as { user_id: string } | undefined;
    if (!project || project.user_id !== session.sub) return forbidden();
    await db.prepare("UPDATE checklist_items SET status = ? WHERE id = ? AND checklist_id = ?").run(status, itemId, id);
    return ok({ updated: true });
  } catch (e) {
    return handleError(e);
  }
}
