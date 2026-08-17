import { z } from "zod";
import { getDb, now, uid, parseJson } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, notFound, unauthorized, forbidden, handleError } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  location_region: z.string().max(120).nullable().optional(),
  location_district: z.string().max(120).nullable().optional(),
  location_assembly: z.string().max(120).nullable().optional(),
  project_type: z.string().max(60).nullable().optional(),
  occupancy: z.string().max(60).nullable().optional(),
  floors: z.coerce.number().int().min(0).max(200).nullable().optional(),
  building_height: z.coerce.number().min(0).nullable().optional(),
  floor_area: z.coerce.number().min(0).nullable().optional(),
  site_area: z.coerce.number().min(0).nullable().optional(),
  occupants: z.coerce.number().int().min(0).nullable().optional(),
  structural_system: z.string().max(120).nullable().optional(),
  basement: z.coerce.boolean().nullable().optional(),
  roof_type: z.string().max(60).nullable().optional(),
  special_conditions: z.array(z.string()).nullable().optional(),
  authority_id: z.string().max(60).nullable().optional()
});

function loadProject(db: ReturnType<typeof getDb>, id: string, userId: string) {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!project) return null;
  if (project.user_id !== userId) return "FORBIDDEN";
  return project;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = getDb();
    const project = loadProject(db, id, session.sub);
    if (project === null) return notFound("Project not found");
    if (project === "FORBIDDEN") return forbidden();
    const findings = db.prepare("SELECT * FROM compliance_findings WHERE project_id = ? ORDER BY created_at DESC LIMIT 100").all(id) as unknown[];
    const checks = db.prepare("SELECT * FROM compliance_checks WHERE project_id = ? ORDER BY created_at DESC").all(id) as unknown[];
    return ok({ project, findings, checks });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = getDb();
    const existing = loadProject(db, id, session.sub);
    if (existing === null) return notFound("Project not found");
    if (existing === "FORBIDDEN") return forbidden();

    const parsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid project payload.");
    const p = parsed.data;

    const cols: string[] = [];
    const vals: unknown[] = [];
    const ints = new Set(["floors", "occupants"]);
    const floats = new Set(["building_height", "floor_area", "site_area"]);
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined) continue;
      let val: unknown = v;
      if (k === "special_conditions") val = JSON.stringify(v ?? []);
      if (ints.has(k) && v !== null) val = Number(v);
      if (floats.has(k) && v !== null) val = Number(v);
      if (k === "basement" && v !== null) val = v ? 1 : 0;
      cols.push(`${k} = ?`);
      vals.push(val);
    }
    if (!cols.length) return badRequest("No fields to update.");
    cols.push("updated_at = ?");
    vals.push(now());
    vals.push(id);
    db.prepare(`UPDATE projects SET ${cols.join(", ")} WHERE id = ?`).run(...vals);
    db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'update', 'project', ?, ?)").run(
      uid("aud"), session.sub, id, JSON.stringify({ fields: Object.keys(p) })
    );
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Record<string, unknown>;
    return ok({ project });
  } catch (e) {
    return handleError(e);
  }
}
