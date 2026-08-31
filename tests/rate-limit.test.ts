import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketStart } from "../src/lib/security/rate-limit.ts";

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
