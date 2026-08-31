import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketStart, rateLimitConfig, NAMED_LIMITS } from "../src/lib/security/rate-limit-policy.ts";

test("bucketStart aligns to the configured window", () => {
  assert.equal(bucketStart(1000, 1000), 1000);
  assert.equal(bucketStart(1500, 1000), 1000);
  assert.equal(bucketStart(999, 1000), 0);
  assert.equal(bucketStart(5_999_999, 60_000), 5_940_000);
});

test("bucketStart handles boundary windows", () => {
  assert.equal(bucketStart(60_000 * 10, 60_000), 60_000 * 10);
  assert.equal(bucketStart(60_000 * 10 - 1, 60_000), 60_000 * 9);
});

test("rateLimitConfig returns defaults for unknown names", () => {
  assert.equal(rateLimitConfig("login").limit, 10);
  assert.equal(rateLimitConfig("unknown-name"), rateLimitConfig("login"));
});

test("all named limits are positive", () => {
  for (const [name, cfg] of Object.entries(NAMED_LIMITS)) {
    assert.ok(cfg.limit > 0, `${name}.limit > 0`);
    assert.ok(cfg.windowMs > 0, `${name}.windowMs > 0`);
  }
});
