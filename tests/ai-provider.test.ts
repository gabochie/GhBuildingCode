import { test } from "node:test";
import assert from "node:assert/strict";
import { aiConfigured } from "../src/lib/ai/provider.ts";

test("aiConfigured returns false when no keys are set", () => {
  const origKey = process.env.AI_API_KEY;
  const origFallback = process.env.AI_FALLBACK_API_KEY;
  delete process.env.AI_API_KEY;
  delete process.env.AI_FALLBACK_API_KEY;

  assert.equal(aiConfigured(), false);

  process.env.AI_API_KEY = origKey;
  process.env.AI_FALLBACK_API_KEY = origFallback;
});

test("aiConfigured returns true when AI_API_KEY is set", () => {
  const origKey = process.env.AI_API_KEY;
  process.env.AI_API_KEY = "test-key";
  assert.equal(aiConfigured(), true);
  process.env.AI_API_KEY = origKey;
});

test("aiConfigured returns true when only AI_FALLBACK_API_KEY is set", () => {
  const origKey = process.env.AI_API_KEY;
  const origFallback = process.env.AI_FALLBACK_API_KEY;
  delete process.env.AI_API_KEY;
  process.env.AI_FALLBACK_API_KEY = "fallback-key";

  assert.equal(aiConfigured(), true);

  process.env.AI_API_KEY = origKey;
  process.env.AI_FALLBACK_API_KEY = origFallback;
});
