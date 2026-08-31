import { test } from "node:test";
import assert from "node:assert/strict";
import { ghsToMinor, planPrice, addMonthsIso, isExpired, monthlyPeriod } from "../src/lib/billing/price.ts";

test("ghsToMinor parses GHS labels into pesewa amounts", () => {
  assert.equal(ghsToMinor("GH₵399"), "399");
  assert.equal(ghsToMinor("GH₵1,299"), "1299");
  assert.equal(ghsToMinor("GH₵0"), "0");
  assert.equal(ghsToMinor(""), "0");
});

test("planPrice resolves GHS price for chargeable plans only", () => {
  const prof = planPrice("professional");
  assert.ok(prof);
  assert.equal(prof!.currency, "GHS");
  assert.equal(prof!.amountMinor, "399");
  assert.equal(prof!.label, "GH₵399");

  const studio = planPrice("studio");
  assert.equal(studio!.amountMinor, "1299");

  // Free and custom/enterprise are never chargeable online.
  assert.equal(planPrice("free"), null);
  assert.equal(planPrice("enterprise"), null);
  assert.equal(planPrice("unknown-plan"), null);
});

test("monthlyPeriod is UTC YYYY-MM", () => {
  assert.equal(monthlyPeriod(new Date("2026-08-15T10:00:00Z")), "2026-08");
  assert.equal(monthlyPeriod(new Date("2026-12-31T23:00:00Z")), "2026-12");
});

test("addMonthsIso advances by whole months in UTC", () => {
  assert.equal(addMonthsIso("2026-01-15T00:00:00.000Z", 1), "2026-02-15T00:00:00.000Z");
  assert.equal(addMonthsIso("2026-01-15T00:00:00.000Z", 12), "2027-01-15T00:00:00.000Z");
  // null falls back to now — still a valid ISO timestamp.
  assert.ok(!Number.isNaN(Date.parse(addMonthsIso(null, 1))));
});

test("isExpired compares against now", () => {
  assert.equal(isExpired("2026-01-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), true);
  assert.equal(isExpired("2026-12-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), false);
  assert.equal(isExpired(null, "2026-06-01T00:00:00.000Z"), true);
  // Boundary: equal timestamps count as expired.
  assert.equal(isExpired("2026-06-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), true);
});
