import { randomUUID } from "node:crypto";
import { z } from "zod";
import { evaluateRules } from "@/lib/rules/engine";
import { RULE_LIBRARY } from "@/lib/rules/seed-rules";
import { searchRequirements } from "@/lib/ai/retrieval";
import { occupancyGroups } from "@/lib/compliance/check";
import { authenticateAgent, logUsage } from "@/lib/auth/api-key";
import { ok, unauthorized, badRequest, handleError } from "@/lib/api";

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
  const started = Date.now();
  const requestId = randomUUID();
  const apiKey = await authenticateAgent(req);
  if (!apiKey) return unauthorized("Valid GHBC API key required (Authorization: Bearer <key>).");
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      await logUsage({ apiKeyId: String(apiKey.id), endpoint: "/agent/compliance-check", method: "POST", statusCode: 400, latencyMs: Date.now() - started, requestId });
      return badRequest("Invalid payload.");
    }
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
    const retrieved = searchRequirements({ query: occupancyGroups(p.occupancy).join(" "), limit: 12 });

    const data = {
      status: engine.findings.some((f) => f.severity === "CRITICAL") ? "action_required" : "review_required",
      applicable_requirements: retrieved.map((r) => ({
        requirement_id: r.requirement_id,
        source_document: r.source_document,
        part: r.part,
        section: r.section,
        clause: r.clause,
        requirement_type: r.requirement_type,
        editorial_state: r.editorial_state
      })),
      issues: engine.findings.map((f) => ({
        rule_id: f.rule_id,
        status: f.status,
        severity: f.severity,
        issue: f.issue,
        reason: f.reason,
        source_reference: f.source_reference
      })),
      missing_information: engine.missing_information,
      sources: retrieved.map((r) => ({
        source_document: r.source_document,
        part: r.part,
        section: r.section,
        clause: r.clause,
        page: r.page,
        status: r.editorial_state === "VERIFIED" ? "verified" : "needs_verification"
      })),
      confidence: retrieved.length
        ? Math.min(0.9, 0.5 + (retrieved.filter((r) => r.editorial_state === "VERIFIED").length / retrieved.length) * 0.4)
        : 0
    };
    await logUsage({ apiKeyId: String(apiKey.id), endpoint: "/agent/compliance-check", method: "POST", statusCode: 200, latencyMs: Date.now() - started, requestId });
    return ok(data);
  } catch (e) {
    await logUsage({ apiKeyId: String(apiKey.id), endpoint: "/agent/compliance-check", method: "POST", statusCode: 500, latencyMs: Date.now() - started, requestId });
    return handleError(e);
  }
}
