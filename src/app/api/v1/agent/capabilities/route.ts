import { ok, handleError } from "@/lib/api";

const CAPABILITIES = [
  "get_applicable_requirements",
  "classify_occupancy",
  "check_fire_requirements",
  "check_accessibility",
  "check_means_of_escape",
  "check_site_requirements",
  "check_documentation",
  "check_permit_readiness",
  "find_authority_requirements",
  "get_requirement_source",
  "explain_requirement",
  "generate_compliance_report"
];

export async function GET() {
  try {
    return ok({
      service: "GHBC Agent API",
      version: "v1",
      base_url: "/api/v1/agent",
      capabilities: CAPABILITIES,
      example: {
        endpoint: "POST /api/v1/agent/compliance-check",
        content_type: "application/json",
        auth: "Authorization: Bearer ghbc_live_..."
      }
    });
  } catch (e) {
    return handleError(e);
  }
}
