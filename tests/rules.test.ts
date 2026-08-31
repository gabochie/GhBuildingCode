import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRules, computeReadinessScore, statusLabel } from "../src/lib/rules/engine.ts";
import { RULE_LIBRARY } from "../src/lib/rules/seed-rules.ts";

function ruleMap(findings: ReturnType<typeof evaluateRules>["findings"]) {
  return new Map(findings.map((f) => [f.rule_id, f]));
}

test("multi-storey residential triggers fire/escape and exit findings", () => {
  const res = evaluateRules(
    { occupancy: "residential", floors: 4, floor_area: 900, occupants: 40 },
    RULE_LIBRARY
  );
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-009")?.status, "REVIEW");
  assert.equal(m.get("R-009")?.severity, "HIGH");
  assert.equal(m.get("R-005")?.status, "REVIEW");
  assert.ok(res.applicable_requirement_ids.includes("R-009"));
});

test("small 2-storey building flags Part 35 as NOT_VERIFIED (unverified rule)", () => {
  const res = evaluateRules({ occupancy: "residential", floors: 2, floor_area: 150 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-010")?.status, "NOT_VERIFIED");
  assert.equal(m.get("R-010")?.source_verified, false);
});

test("assembly with 300+ occupants activates sprinkler review", () => {
  const res = evaluateRules({ occupancy: "assembly", occupants: 350, floors: 1 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-006")?.status, "REVIEW");
  assert.match(String(m.get("R-006")?.source_reference), /10\.3\.2\.1\.7/);
});

test("missing inputs produce MISSING_INFORMATION instead of findings", () => {
  const res = evaluateRules({ occupancy: "residential" }, RULE_LIBRARY);
  assert.equal(res.findings.length, 0);
  assert.ok(res.missing_information.length > 0);
  assert.ok(res.missing_information.includes("floors"));
  assert.ok(res.missing_information.includes("occupants"));
});

test("verified source rules carry PASS output when input present", () => {
  const res = evaluateRules({ stair_riser_height: 150, occupancy: "residential" }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-001")?.status, "PASS");
  assert.equal(m.get("R-001")?.source_verified, true);
});

test("R-001 emits FAIL when riser height is below the 102mm minimum", () => {
  const res = evaluateRules({ stair_riser_height: 90 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-001")?.status, "FAIL");
  assert.equal(m.get("R-001")?.severity, "HIGH");
});

test("R-001 emits FAIL when riser height exceeds the 178mm maximum", () => {
  const res = evaluateRules({ stair_riser_height: 200 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-001")?.status, "FAIL");
});

test("R-001 emits PASS for a riser height within the legal range", () => {
  const res = evaluateRules({ stair_riser_height: 160 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-001")?.status, "PASS");
});

test("R-002 emits FAIL when tread depth is below 279mm", () => {
  const res = evaluateRules({ stair_tread_depth: 250 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-002")?.status, "FAIL");
});

test("R-002 emits PASS when tread depth meets the 279mm minimum", () => {
  const res = evaluateRules({ stair_tread_depth: 300 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-002")?.status, "PASS");
});

test("R-003 emits FAIL only when stair width is below 1219mm and not sprinklered", () => {
  const fail = evaluateRules({ stair_width: 1000, sprinklered: false }, RULE_LIBRARY);
  assert.equal(ruleMap(fail.findings).get("R-003")?.status, "FAIL");

  const sprinklered = evaluateRules({ stair_width: 1000, sprinklered: true }, RULE_LIBRARY);
  assert.equal(ruleMap(sprinklered.findings).get("R-003")?.status, "PASS");

  const wide = evaluateRules({ stair_width: 1500, sprinklered: false }, RULE_LIBRARY);
  assert.equal(ruleMap(wide.findings).get("R-003")?.status, "PASS");
});

test("unverified rule produces NOT_VERIFIED even when matched", () => {
  const res = evaluateRules({ occupancy: "business", floors: 1, floor_area: 300 }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-008")?.status, "NOT_VERIFIED");
});

test("renovation triggers existing-building provisions", () => {
  const res = evaluateRules({ project_type: "renovation", occupancy: "residential" }, RULE_LIBRARY);
  const m = ruleMap(res.findings);
  assert.equal(m.get("R-012")?.status, "NOT_VERIFIED");
  assert.match(String(m.get("R-012")?.source_reference), /Part 36/);
});

test("readiness score is clamped between 5 and 98", () => {
  const res = evaluateRules(
    { occupancy: "residential", floors: 4, floor_area: 900, occupants: 40 },
    RULE_LIBRARY
  );
  const score = computeReadinessScore(res.findings);
  assert.ok(score >= 5 && score <= 98);
  assert.equal(typeof score, "number");
});

test("statusLabel maps internal statuses to display labels", () => {
  assert.equal(statusLabel("PASS"), "PASS");
  assert.equal(statusLabel("MISSING_INFORMATION"), "MISSING INFORMATION");
  assert.equal(statusLabel("NOT_VERIFIED"), "NOT VERIFIED");
  assert.equal(statusLabel("UNKNOWN"), "UNKNOWN");
});
