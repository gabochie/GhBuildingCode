import { z } from "zod";
import { getDb, uid, now, parseJson } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, created, badRequest, unauthorized, limitReached, handleError } from "@/lib/api";
import { runComplianceCheck } from "@/lib/compliance/check";
import { checkLimit } from "@/lib/billing/plans";

const schema = z.object({
  name: z.string().min(2).max(200),
  location_region: z.string().max(120).optional(),
  location_district: z.string().max(120).optional(),
  location_assembly: z.string().max(120).optional(),
  project_type: z.string().max(60).optional(),
  occupancy: z.string().max(60).optional(),
  floors: z.coerce.number().int().min(0).max(200).optional(),
  building_height: z.coerce.number().min(0).optional(),
  floor_area: z.coerce.number().min(0).optional(),
  site_area: z.coerce.number().min(0).optional(),
  occupants: z.coerce.number().int().min(0).optional(),
  structural_system: z.string().max(120).optional(),
  basement: z.coerce.boolean().optional(),
  roof_type: z.string().max(60).optional(),
  special_conditions: z.array(z.string()).optional(),
  authority_id: z.string().max(60).optional(),
  auto_review: z.coerce.boolean().optional()
});

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const db = await getDb();
    const projects = (await db
      .prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC")
      .all(session.sub)) as unknown[];
    return ok({ projects });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid project payload.");
    const p = parsed.data;
    const db = await getDb();
    const chk = await checkLimit(session.sub, session.plan, "projects");
    if (!chk.allowed) return limitReached("projects", chk.used, chk.limit, session.plan);
    const id = uid("prj");
    await db.prepare(
      `INSERT INTO projects
        (id, user_id, name, status, location_region, location_district, location_assembly,
         project_type, occupancy, floors, building_height, floor_area, site_area, occupants,
         structural_system, basement, roof_type, special_conditions, authority_id, created_at, updated_at)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, session.sub, p.name,
      p.location_region ?? null, p.location_district ?? null, p.location_assembly ?? null,
      p.project_type ?? null, p.occupancy ?? null, p.floors ?? null, p.building_height ?? null,
      p.floor_area ?? null, p.site_area ?? null, p.occupants ?? null, p.structural_system ?? null,
      p.basement == null ? null : p.basement ? 1 : 0, p.roof_type ?? null, JSON.stringify(p.special_conditions ?? []),
      p.authority_id ?? null, now(), now()
    );
    const project = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as Record<string, unknown>;

    let review = null;
    if (p.auto_review) {
      review = await runComplianceCheck(project);
      await db.prepare("UPDATE projects SET readiness_score = ?, status = 'reviewed' WHERE id = ?").run(
        review.readiness_score, id
      );
    }

    await db.prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'create', 'project', ?, ?)").run(
      uid("aud"), session.sub, id, JSON.stringify({ name: p.name })
    );
    const updated = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as Record<string, unknown>;
    return created({ project: updated, review });
  } catch (e) {
    return handleError(e);
  }
}
