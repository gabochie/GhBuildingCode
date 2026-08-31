export interface RuleCondition {
  key: string;
  operator: "eq" | "gt" | "gte" | "lt" | "lte" | "in" | "includes" | "present";
  value?: unknown;
}

export interface RuleOutput {
  status: "PASS" | "FAIL" | "REVIEW" | "NOT_APPLICABLE" | "MISSING_INFORMATION" | "NOT_VERIFIED";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATION";
  issue: string;
  reason: string;
  recommended_action?: string;
}

export interface Rule {
  rule_id: string;
  name: string;
  description: string;
  source_reference: string;
  source_verified: boolean;
  requirement_ids: string[];
  conditions: RuleCondition[];
  input_variables: string[];
  outputs: RuleOutput[];
  /**
   * Optional per-output selection predicates. The engine emits the output whose
   * index is first listed with all its conditions satisfied. When absent (or no
   * predicate matches), it falls back to `outputs[0]`. This enables real
   * threshold evaluation (e.g. riser within 102–178mm -> PASS, otherwise FAIL)
   * rather than always emitting the first output.
   */
  output_conditions?: Array<{ output_index: number; conditions: RuleCondition[] }>;
}

export type ProjectProfile = Record<string, unknown>;

/**
 * Rule library — deterministic Layer 1 of the hybrid AI architecture (§20).
 *
 * IMPORTANT: thresholds below come ONLY from extracted GS 1207:2018 source
 * clauses (source_reference). Rules whose numeric thresholds could not be
 * confirmed against extraction are marked source_verified=false and produce
 * REVIEW / NOT_VERIFIED findings rather than PASS/FAIL.
 */
export const RULE_LIBRARY: Rule[] = [
  {
    rule_id: "R-001",
    name: "Stair riser height within code range",
    description: "Stair riser heights shall be 178 mm (7 in) maximum and 102 mm (4 in) minimum.",
    source_reference: "GS 1207:2018, Part 11, §11.11.5.2",
    source_verified: true,
    requirement_ids: ["stair-riser-tread"],
    input_variables: ["stair_riser_height"],
    conditions: [{ key: "stair_riser_height", operator: "present" }],
    outputs: [
      {
        status: "PASS",
        severity: "INFORMATION",
        issue: "Stair riser height within code range",
        reason: "Provided riser height falls within the 102–178 mm range required by §11.11.5.2."
      },
      {
        status: "FAIL",
        severity: "HIGH",
        issue: "Stair riser height outside permitted range",
        reason: "§11.11.5.2 requires riser heights 102 mm (4 in) minimum and 178 mm (7 in) maximum."
      }
    ],
    output_conditions: [
      { output_index: 1, conditions: [{ key: "stair_riser_height", operator: "lt", value: 102 }] },
      { output_index: 1, conditions: [{ key: "stair_riser_height", operator: "gt", value: 178 }] }
    ]
  },
  {
    rule_id: "R-002",
    name: "Stair tread depth minimum",
    description: "Rectangular tread depths shall be 279 mm (11 in) minimum.",
    source_reference: "GS 1207:2018, Part 11, §11.11.5.2",
    source_verified: true,
    requirement_ids: ["stair-riser-tread"],
    input_variables: ["stair_tread_depth"],
    conditions: [{ key: "stair_tread_depth", operator: "present" }],
    outputs: [
      {
        status: "PASS",
        severity: "INFORMATION",
        issue: "Stair tread depth meets minimum",
        reason: "Provided tread depth is not less than 279 mm (11 in)."
      },
      {
        status: "FAIL",
        severity: "HIGH",
        issue: "Stair tread depth below minimum",
        reason: "§11.11.5.2 requires rectangular tread depths 279 mm (11 in) minimum."
      }
    ],
    output_conditions: [
      { output_index: 1, conditions: [{ key: "stair_tread_depth", operator: "lt", value: 279 }] }
    ]
  },
  {
    rule_id: "R-003",
    name: "Stair clear width between handrails",
    description: "Stairways shall have a clear width of 1219 mm (48 in) minimum between handrails unless sprinklered.",
    source_reference: "GS 1207:2018, Part 11, §11.9.3.2",
    source_verified: true,
    requirement_ids: ["stair-width"],
    input_variables: ["stair_width"],
    conditions: [{ key: "stair_width", operator: "present" }],
    outputs: [
      {
        status: "PASS",
        severity: "INFORMATION",
        issue: "Stair clear width meets minimum",
        reason: "Provided stair clear width is not less than 1219 mm (48 in), or the building is sprinklered."
      },
      {
        status: "FAIL",
        severity: "HIGH",
        issue: "Stair clear width below minimum",
        reason: "§11.9.3.2 requires 1219 mm (48 in) minimum clear width between handrails (exception for sprinklered buildings)."
      }
    ],
    output_conditions: [
      { output_index: 1, conditions: [{ key: "stair_width", operator: "lt", value: 1219 }, { key: "sprinklered", operator: "eq", value: false }] }
    ]
  },
  {
    rule_id: "R-004",
    name: "Occupancy classification — small assembly",
    description: "A building or tenant space used for assembly purposes with an occupant load of less than 50 persons shall be classified as Group B.",
    source_reference: "GS 1207:2018, Part 3, §3.3.1.1",
    source_verified: true,
    requirement_ids: ["occupancy-classification"],
    input_variables: ["occupancy", "occupants"],
    conditions: [
      { key: "occupancy", operator: "in", value: ["assembly", "A", "A-1", "A-2", "A-3", "A-4", "A-5"] },
      { key: "occupants", operator: "present" }
    ],
    outputs: [
      {
        status: "REVIEW",
        severity: "MEDIUM",
        issue: "Verify occupancy classification for small assembly space",
        reason: "§3.3.1.1 classifies assembly spaces with fewer than 50 occupants as Group B. Confirm the occupant load and classification."
      }
    ]
  },
  {
    rule_id: "R-005",
    name: "Two exits — occupant load or common path threshold",
    description: "Two exits or exit access doorways from any space shall be provided where the design occupant load or the common path of escape travel distance exceeds the values listed in §11.6.2.1.",
    source_reference: "GS 1207:2018, Part 11, §11.6.2.1",
    source_verified: true,
    requirement_ids: ["two-exits", "means-of-escape"],
    input_variables: ["occupants", "floor_area"],
    conditions: [
      { key: "occupancy", operator: "in", value: ["assembly", "business", "educational", "institutional", "mercantile", "residential", "high-hazard"] },
      { key: "occupants", operator: "present" }
    ],
    outputs: [
      {
        status: "REVIEW",
        severity: "HIGH",
        issue: "Confirm exit count against §11.6.2.1 thresholds",
        reason: "Two exits are required where design occupant load or common path of escape travel distance exceeds the table values in §11.6.2.1. Table values require professional confirmation."
      }
    ]
  },
  {
    rule_id: "R-006",
    name: "Fire sprinkler — multiple Group A fire areas sharing exits",
    description: "An automatic sprinkler system shall be provided where multiple fire areas of Group A-1, A-2, A-3 or A-4 occupancies share exit or exit access components and the combined occupant load is 300 or more.",
    source_reference: "GS 1207:2018, Part 10, §10.3.2.1.7",
    source_verified: true,
    requirement_ids: ["sprinkler", "fire-protection"],
    input_variables: ["occupancy", "occupants"],
    conditions: [
      { key: "occupancy", operator: "in", value: ["assembly", "A", "A-1", "A-2", "A-3", "A-4"] },
      { key: "occupants", operator: "gte", value: 300 }
    ],
    outputs: [
      {
        status: "REVIEW",
        severity: "HIGH",
        issue: "Sprinkler requirement likely activated",
        reason: "Combined occupant load ≥300 in multiple Group A fire areas sharing exit components activates §10.3.2.1.7. Confirm fire-area sharing."
      }
    ]
  },
  {
    rule_id: "R-007",
    name: "Building height — storey-based building area aggregation",
    description: "For buildings with more than three stories above grade plane, the total building area is limited by the aggregate sum of actual/allowable area ratios.",
    source_reference: "GS 1207:2018, Part 6, §6.10.13",
    source_verified: true,
    requirement_ids: ["building-height-area"],
    input_variables: ["floors", "floor_area"],
    conditions: [
      { key: "floors", operator: "gt", value: 3 },
      { key: "floor_area", operator: "present" }
    ],
    outputs: [
      {
        status: "REVIEW",
        severity: "MEDIUM",
        issue: "Multi-storey building area aggregation applies",
        reason: "Buildings with more than three stories must satisfy the aggregate area ratio check in §6.10.13."
      }
    ]
  },
  {
    rule_id: "R-008",
    name: "Accessibility requirements",
    description: "Public, assembly, business, educational, institutional and mercantile buildings trigger accessibility requirements (Part 12).",
    source_reference: "GS 1207:2018, Part 12",
    source_verified: false,
    requirement_ids: ["accessibility"],
    input_variables: ["occupancy"],
    conditions: [
      { key: "occupancy", operator: "in", value: ["assembly", "business", "educational", "institutional", "mercantile", "high-hazard"] }
    ],
    outputs: [
      {
        status: "NOT_VERIFIED",
        severity: "MEDIUM",
        issue: "Accessibility requirements apply — verify against Part 12",
        reason: "Part 12 (Accessibility) governs these occupancies. Extraction coverage for Part 12 is limited; verify specific requirements against the source."
      }
    ]
  },
  {
    rule_id: "R-009",
    name: "Means of escape for multi-storey residential",
    description: "Residential buildings above 3 storeys require verified fire/means-of-escape review.",
    source_reference: "GS 1207:2018, Part 6 §6.10.13, Part 10, Part 11",
    source_verified: true,
    requirement_ids: ["means-of-escape", "fire-protection"],
    input_variables: ["floors", "occupancy"],
    conditions: [
      { key: "occupancy", operator: "in", value: ["residential", "R", "R-1", "R-2", "R-3", "R-4"] },
      { key: "floors", operator: "gt", value: 3 }
    ],
    outputs: [
      {
        status: "REVIEW",
        severity: "HIGH",
        issue: "Multi-storey residential — fire and means of escape review required",
        reason: "Residential buildings above three storeys activate heightened fire-protection and means-of-escape requirements. Professional review required."
      }
    ]
  },
  {
    rule_id: "R-010",
    name: "Small building provisions",
    description: "Small buildings may qualify for reduced requirements under Part 35.",
    source_reference: "GS 1207:2018, Part 35",
    source_verified: false,
    requirement_ids: ["small-buildings"],
    input_variables: ["floors", "floor_area"],
    conditions: [
      { key: "floors", operator: "lte", value: 2 },
      { key: "floor_area", operator: "lte", value: 200 }
    ],
    outputs: [
      {
        status: "NOT_VERIFIED",
        severity: "LOW",
        issue: "Possibly eligible for Part 35 small-building provisions",
        reason: "Small buildings may qualify for reduced requirements. Verify eligibility criteria in Part 35."
      }
    ]
  },
  {
    rule_id: "R-011",
    name: "Public assembly — occupancy load verification",
    description: "Group A (assembly) occupancies need verified occupant-load and means-of-escape compliance.",
    source_reference: "GS 1207:2018, Part 3, Part 4, Part 11",
    source_verified: true,
    requirement_ids: ["occupant-load", "means-of-escape"],
    input_variables: ["occupancy", "occupants"],
    conditions: [{ key: "occupancy", operator: "in", value: ["assembly", "A", "A-1", "A-2", "A-3", "A-4", "A-5"] }],
    outputs: [
      {
        status: "REVIEW",
        severity: "HIGH",
        issue: "Assembly occupancy requires verified occupant load and escape design",
        reason: "Group A occupancies must be designed for their occupant load with compliant means of escape (Parts 3, 4, 11)."
      }
    ]
  },
  {
    rule_id: "R-012",
    name: "Existing building / alteration provisions",
    description: "Renovation, extension, change of use and existing-building work may be governed by Part 36 (existing buildings).",
    source_reference: "GS 1207:2018, Part 36",
    source_verified: false,
    requirement_ids: ["existing-buildings"],
    input_variables: ["project_type"],
    conditions: [{ key: "project_type", operator: "in", value: ["renovation", "extension", "change_of_use", "existing_building"] }],
    outputs: [
      {
        status: "NOT_VERIFIED",
        severity: "MEDIUM",
        issue: "Existing-building provisions may apply",
        reason: "Part 36 (Existing Buildings) governs this project type. Extraction coverage is limited; verify applicable provisions against the source."
      }
    ]
  }
];
