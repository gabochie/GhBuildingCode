import { getDb, uid, now, parseJson } from "@/lib/db";
import { evaluateRules, computeReadinessScore, type RuleFinding } from "@/lib/rules/engine";
import { RULE_LIBRARY, type ProjectProfile } from "@/lib/rules/seed-rules";
import { searchRequirements, type RetrievedRequirement } from "@/lib/ai/retrieval";

export interface ProjectInput {
  name: string;
  location_region?: string;
  location_district?: string;
  location_assembly?: string;
  project_type?: string;
  occupancy?: string;
  floors?: number;
  building_height?: number;
  floor_area?: number;
  site_area?: number;
  occupants?: number;
  structural_system?: string;
  basement?: boolean;
  roof_type?: string;
  special_conditions?: string[];
  authority_id?: string;
}

export const OCCUPANCY_TO_GROUP: Record<string, string[]> = {
  residential: ["R", "R-1", "R-2", "R-3", "R-4"],
  assembly: ["A", "A-1", "A-2", "A-3", "A-4", "A-5"],
  business: ["B"],
  educational: ["E"],
  institutional: ["I", "I-1", "I-2", "I-3", "I-4"],
  mercantile: ["M"],
  industrial: ["F", "F-1", "F-2"],
  storage: ["S", "S-1", "S-2"],
  "high_hazard": ["H", "H-1", "H-2", "H-3", "H-4", "H-5"],
  utility: ["U"]
};

export function occupancyGroups(occupancy?: string): string[] {
  if (!occupancy) return [];
  const key = occupancy.toLowerCase().trim();
  if (OCCUPANCY_TO_GROUP[key]) return OCCUPANCY_TO_GROUP[key];
  return [occupancy.toUpperCase()];
}

export interface MatrixRow {
  requirement_id: string;
  source_document: string;
  part: number;
  section: string;
  clause: string;
  title: string;
  requirement_type: string;
  source_text: string;
  status: string;
  severity?: string;
  responsible_professional: string;
  evidence: string;
  source: string;
}

export interface ComplianceResult {
  check_id: string;
  project_id: string;
  readiness_score: number;
  findings: RuleFinding[];
  matrix: MatrixRow[];
  missing_information: string[];
  applicable_requirement_ids: string[];
}

export function profileFromProject(row: Record<string, unknown>): ProjectProfile {
  const special = parseJson<string[]>(String(row.special_conditions ?? "[]"), []);
  return {
    name: row.name,
    location: row.location_assembly ?? row.location_district ?? row.location_region,
    project_type: row.project_type,
    occupancy: row.occupancy,
    floors: row.floors,
    building_height: row.building_height,
    floor_area: row.floor_area,
    site_area: row.site_area,
    occupants: row.occupants,
    structural_system: row.structural_system,
    basement: row.basement ? true : false,
    roof_type: row.roof_type,
    special_conditions: special
  };
}

const RESPONSIBLE: Record<string, string> = {
  stair: "Architect / Fire Consultant",
  escape: "Architect / Fire Consultant",
  fire: "Fire Consultant / Architect",
  sprinkler: "Fire Consultant / MEP Engineer",
  accessibility: "Architect / Accessibility Consultant",
  "occupancy": "Architect",
  "occupant-load": "Architect / QS",
  height: "Architect / Structural Engineer",
  area: "Architect",
  small: "Architect",
  existing: "Architect / Building Control Officer",
  structure: "Structural Engineer",
  electrical: "MEP Engineer",
  mechanical: "MEP Engineer",
  plumbing: "MEP Engineer",
  site: "Planning Consultant / Surveyor",
  documentation: "Architect / QS",
  permit: "Planning Consultant"
};

function responsibleFor(requirement_type: string, text: string): string {
  const t = (requirement_type + " " + text).toLowerCase();
  for (const key of Object.keys(RESPONSIBLE)) {
    if (t.includes(key)) return RESPONSIBLE[key];
  }
  return "Registered Professional";
}

export async function runComplianceCheck(project: Record<string, unknown>): Promise<ComplianceResult> {
  const db = await getDb();
  const profile = profileFromProject(project);
  const engineResult = evaluateRules(profile, RULE_LIBRARY);
  const score = computeReadinessScore(engineResult.findings);

  // Retrieval: pull requirements matching the project's occupancy and known
  // relevant domains (part filters from special conditions + occupancy).
  const partsBySpecial: Record<string, number> = {
    fire_safety: 10,
    means_of_escape: 11,
    accessibility: 12,
    high_rise: 6,
    structural: 17,
    site: 5,
    existing: 36,
    small: 35,
    green: 37
  };
  const special = parseJson<string[]>(String(project.special_conditions ?? "[]"), []);
  const partHints = special
    .map((s) => partsBySpecial[s])
    .filter((p): p is number => Boolean(p));

  const groups = occupancyGroups(String(project.occupancy ?? ""));
  const retrieved = await searchRequirements({
    query: [String(project.occupancy ?? ""), ...groups].join(" "),
    limit: 20
  });

  const matrix: MatrixRow[] = retrieved.slice(0, 16).map((r: RetrievedRequirement) => ({
    requirement_id: r.requirement_id,
    source_document: r.source_document,
    part: r.part,
    section: r.section,
    clause: r.clause,
    title: "",
    requirement_type: r.requirement_type,
    source_text: r.source_text,
    status: "NOT VERIFIED",
    responsible_professional: responsibleFor(r.requirement_type, r.source_text),
    evidence: "—",
    source: `${r.source_document}, Part ${r.part}${r.section ? ` §${r.section}` : ""}${r.clause ? `, ${r.clause}` : ""}`
  }));

  const check_id = uid("chk");
  await db.prepare(
    `INSERT INTO compliance_checks (id, project_id, status, summary_json, created_at)
     VALUES (?, ?, 'completed', ?, ?)`
  ).run(check_id, project.id, JSON.stringify({ readiness_score: score, findings: engineResult.findings.length }), now());

  const insertFinding = db.prepare(
    `INSERT INTO compliance_findings
       (id, check_id, project_id, requirement_id, status, severity, confidence, issue, reason, recommended_action, source_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const f of engineResult.findings) {
    await insertFinding.run(
      uid("fnd"),
      check_id,
      project.id,
      f.requirement_ids.join(",") || null,
      f.status,
      f.severity,
      f.source_verified ? 0.9 : 0.6,
      f.issue,
      f.reason,
      f.recommended_action ?? null,
      JSON.stringify({ source_reference: f.source_reference }),
      now()
    );
  }

  await db.prepare("UPDATE projects SET readiness_score = ?, status = 'reviewed', updated_at = ? WHERE id = ?").run(
    score,
    now(),
    project.id
  );

  return {
    check_id,
    project_id: String(project.id),
    readiness_score: score,
    findings: engineResult.findings,
    matrix,
    missing_information: engineResult.missing_information,
    applicable_requirement_ids: engineResult.applicable_requirement_ids
  };
}
