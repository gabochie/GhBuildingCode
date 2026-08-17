import { z } from "zod";
import { evaluateRules } from "@/lib/rules/engine";
import { RULE_LIBRARY } from "@/lib/rules/seed-rules";
import { searchRequirements } from "@/lib/ai/retrieval";
import { occupancyGroups } from "@/lib/compliance/check";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, unauthorized, limitReached, handleError } from "@/lib/api";
import { checkLimit, incrementUsage } from "@/lib/billing/plans";

const schema = z.object({
  project_type: z.string().optional(),
  location: z.string().optional(),
  storeys: z.coerce.number().int().min(0).max(200).optional(),
  building_height: z.coerce.number().optional(),
  floor_area: z.coerce.number().optional(),
  site_area: z.coerce.number().optional(),
  occupants: z.coerce.number().int().optional(),
  occupancy: z.string().optional(),
  structural_system: z.string().optional(),
  basement: z.coerce.boolean().optional(),
  special_conditions: z.array(z.string()).optional()
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const chk = checkLimit(session.sub, session.plan, "complianceChecksPerMonth");
    if (!chk.allowed) return limitReached("compliance checks", chk.used, chk.limit, session.plan);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid compliance check payload.");
    const p = parsed.data;

    const profile = {
      project_type: p.project_type,
      location: p.location,
      floors: p.storeys,
      building_height: p.building_height,
      floor_area: p.floor_area,
      site_area: p.site_area,
      occupants: p.occupants,
      occupancy: p.occupancy,
      structural_system: p.structural_system,
      basement: p.basement,
      special_conditions: p.special_conditions ?? []
    };

    const engine = evaluateRules(profile, RULE_LIBRARY);
    const retrieved = searchRequirements({
      query: occupancyGroups(p.occupancy).join(" "),
      limit: 12
    });

    const sources = retrieved.map((r) => ({
      requirement_id: r.requirement_id,
      source_document: r.source_document,
      part: r.part,
      section: r.section,
      clause: r.clause,
      page: r.page,
      status: r.editorial_state === "VERIFIED" ? "verified" : "needs_verification"
    }));

    const applicable = retrieved.map((r) => ({
      requirement_id: r.requirement_id,
      source: `${r.source_document} Part ${r.part}${r.section ? ` §${r.section}` : ""}${r.clause ? ` ${r.clause}` : ""}`,
      requirement_type: r.requirement_type,
      editorial_state: r.editorial_state
    }));

    const issues = engine.findings.map((f) => ({
      rule_id: f.rule_id,
      status: f.status,
      severity: f.severity,
      issue: f.issue,
      reason: f.reason,
      source_reference: f.source_reference
    }));

    const missing = engine.missing_information.map((k) => k);

    incrementUsage(session.sub, "compliance_checks");

    return ok({
      status: engine.findings.some((f) => f.severity === "CRITICAL") ? "action_required" : "review_required",
      applicable_requirements: applicable,
      issues,
      missing_information: missing,
      sources,
      confidence: retrieved.length ? Math.min(0.9, 0.5 + retrieved.filter((r) => r.editorial_state === "VERIFIED").length / retrieved.length * 0.4) : 0
    });
  } catch (e) {
    return handleError(e);
  }
}
