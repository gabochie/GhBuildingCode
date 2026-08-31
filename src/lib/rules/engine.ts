import type { ProjectProfile, Rule, RuleCondition, RuleOutput } from "./seed-rules";

export interface RuleFinding {
  rule_id: string;
  name: string;
  source_reference: string;
  source_verified: boolean;
  requirement_ids: string[];
  status: RuleOutput["status"];
  severity: RuleOutput["severity"];
  issue: string;
  reason: string;
  recommended_action?: string;
}

export interface EngineResult {
  findings: RuleFinding[];
  missing_information: string[];
  applicable_requirement_ids: string[];
}

function evaluateCondition(profile: ProjectProfile, cond: RuleCondition): boolean {
  const v = profile[cond.key];
  switch (cond.operator) {
    case "present":
      return v !== undefined && v !== null && v !== "";
    case "eq":
      return String(v) === String(cond.value);
    case "gt":
      return toNum(v) > toNum(cond.value);
    case "gte":
      return toNum(v) >= toNum(cond.value);
    case "lt":
      return toNum(v) < toNum(cond.value);
    case "lte":
      return toNum(v) <= toNum(cond.value);
    case "in": {
      const list = (cond.value as unknown[]) || [];
      return list.some((x) => String(x).toLowerCase() === String(v).toLowerCase());
    }
    case "includes": {
      const arr = Array.isArray(v) ? v : [];
      return arr.some((x) => String(x).toLowerCase() === String(cond.value).toLowerCase());
    }
    default:
      return false;
  }
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Select the output that should fire for an applicable rule.
 * - If `rule.output_conditions` is defined, emit the first output whose
 *   predicate conditions are all satisfied (real threshold evaluation).
 * - Otherwise fall back to `outputs[0]`.
 */
function selectOutput(profile: ProjectProfile, rule: Rule): RuleOutput {
  const selectors = rule.output_conditions;
  if (selectors && selectors.length) {
    for (const sel of selectors) {
      if (sel.output_index < 0 || sel.output_index >= rule.outputs.length) continue;
      const matched = sel.conditions.every((c) => evaluateCondition(profile, c));
      if (matched) return rule.outputs[sel.output_index];
    }
    return rule.outputs[0];
  }
  return rule.outputs[0];
}

/**
 * Deterministic compliance engine (§10, §20 Layer 1).
 * Evaluates rules against a project profile. The LLM is never the calculator:
 * this function computes applicability, status, and missing information.
 *
 * Output selection: a rule's findings are computed from threshold predicates
 * (`output_conditions`) when provided, falling back to the first output. Rules
 * that depend on input the project hasn't provided produce MISSING_INFORMATION.
 */
export function evaluateRules(profile: ProjectProfile, rules: Rule[]): EngineResult {
  const findings: RuleFinding[] = [];
  const missing = new Set<string>();
  const applicableIds = new Set<string>();

  for (const rule of rules) {
    // All conditions must be evaluable. If a required input variable is absent,
    // report missing information (unless the variable is genuinely optional).
    let blocked = false;
    for (const cond of rule.conditions) {
      const present = profile[cond.key] !== undefined && profile[cond.key] !== null && profile[cond.key] !== "";
      if (!present) {
        missing.add(cond.key);
        blocked = true;
      }
    }
    if (blocked) continue;

    const matched = rule.conditions.every((c) => evaluateCondition(profile, c));
    if (!matched) continue;

    applicableIds.add(rule.rule_id);
    const output = selectOutput(profile, rule);
    findings.push({
      rule_id: rule.rule_id,
      name: rule.name,
      source_reference: rule.source_reference,
      source_verified: rule.source_verified,
      requirement_ids: rule.requirement_ids,
      status: rule.source_verified ? output.status : "NOT_VERIFIED",
      severity: output.severity,
      issue: output.issue,
      reason: output.reason,
      recommended_action: output.recommended_action
    });
  }

  return {
    findings,
    missing_information: Array.from(missing),
    applicable_requirement_ids: Array.from(applicableIds)
  };
}

export function computeReadinessScore(findings: RuleFinding[], baseline = 78): number {
  if (!findings.length) return baseline;
  let score = baseline;
  const penalize: Record<string, number> = {
    CRITICAL: -18,
    HIGH: -12,
    MEDIUM: -6,
    LOW: -2,
    INFORMATION: 0
  };
  for (const f of findings) {
    if (f.status === "PASS") score += 4;
    else if (f.status === "FAIL") score += penalize[f.severity] ?? -8;
    else if (f.status === "REVIEW") score += (penalize[f.severity] ?? -6) / 2;
    else if (f.status === "NOT_VERIFIED") score -= 3;
    else if (f.status === "MISSING_INFORMATION") score -= 4;
  }
  return Math.max(5, Math.min(98, Math.round(score)));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PASS: "PASS",
    FAIL: "FAIL",
    REVIEW: "REVIEW",
    NOT_APPLICABLE: "NOT APPLICABLE",
    MISSING_INFORMATION: "MISSING INFORMATION",
    NOT_VERIFIED: "NOT VERIFIED"
  };
  return map[status] ?? status;
}
