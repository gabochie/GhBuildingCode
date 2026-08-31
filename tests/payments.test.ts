import { test } from "node:test";
import assert from "node:assert/strict";
import { ghsToMinor, planPrice, addMonthsIso, isExpired, isInGracePeriod, GRACE_PERIOD_DAYS, monthlyPeriod, periodMonths, ANNUAL_MONTHS, ANNUAL_BILLED_MONTHS } from "../src/lib/billing/price.ts";

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

test("isInGracePeriod returns true only within GRACE_PERIOD_DAYS after expiry", () => {
  const expiresAt = "2026-06-01T00:00:00.000Z";
  const now1Day = "2026-06-02T00:00:00.000Z"; // +1 day  → within grace
  const now2Days = "2026-06-03T00:00:00.000Z"; // +2 days → within grace
  const now3Days = "2026-06-04T00:00:00.000Z"; // +3 days → boundary, NOT within grace (elapsed = 3 days exactly)
  const now4Days = "2026-06-05T00:00:00.000Z"; // +4 days → past grace

  assert.equal(isInGracePeriod(expiresAt, now1Day), true, "1 day after expiry: in grace");
  assert.equal(isInGracePeriod(expiresAt, now2Days), true, "2 days after expiry: in grace");
  assert.equal(isInGracePeriod(expiresAt, now3Days), false, "3 days after expiry: past grace (boundary)");
  assert.equal(isInGracePeriod(expiresAt, now4Days), false, "4 days after expiry: past grace");

  // Not yet expired → not in grace
  const futureDate = "2026-06-10T00:00:00.000Z";
  assert.equal(isInGracePeriod(expiresAt, futureDate), false, "not yet expired: not in grace");

  // Null expiresAt → not in grace
  assert.equal(isInGracePeriod(null, now1Day), false, "null expiresAt: not in grace");

  // Exact expiry moment → expired (isExpired is true) but 0 elapsed → in grace
  assert.equal(isInGracePeriod(expiresAt, expiresAt), true, "exact expiry moment: in grace");
});

test("GRACE_PERIOD_DAYS is 3", () => {
  assert.equal(GRACE_PERIOD_DAYS, 3);
});

test("planPrice supports annual billing with 2 months free", () => {
  // Monthly
  const profMonthly = planPrice("professional", "monthly");
  assert.equal(profMonthly!.amountMinor, "399");
  const studioMonthly = planPrice("studio", "monthly");
  assert.equal(studioMonthly!.amountMinor, "1299");

  // Annual = 10 months billed (2 free) → 399*10 and 1299*10
  const profAnnual = planPrice("professional", "annual");
  assert.equal(profAnnual!.label, "GH₵3,990");
  assert.equal(profAnnual!.amountMinor, "3990");
  const studioAnnual = planPrice("studio", "annual");
  assert.equal(studioAnnual!.label, "GH₵12,990");
  assert.equal(studioAnnual!.amountMinor, "12990");

  // Free & enterprise never payable regardless of period
  assert.equal(planPrice("free", "annual"), null);
  assert.equal(planPrice("enterprise", "annual"), null);

  // Default period is monthly
  assert.equal(planPrice("professional")!.amountMinor, "399");
});

test("periodMonths maps billing periods to activation months", () => {
  assert.equal(periodMonths("monthly"), 1);
  assert.equal(periodMonths("annual"), 12);
  assert.equal(ANNUAL_MONTHS, 12);
  assert.equal(ANNUAL_BILLED_MONTHS, 10);
});
