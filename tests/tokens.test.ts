import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession, type SessionClaims } from "../src/lib/auth/tokens.ts";

process.env.AUTH_SECRET = "test-secret-key-must-be-at-least-16-chars!!";

const CLAIMS: SessionClaims = {
  sub: "usr_abc123",
  email: "test@example.com",
  name: "Test User",
  role: "admin",
  plan: "pro"
};

test("signSession returns a JWT string", () => {
  const token = signSession(CLAIMS);
  assert.equal(typeof token, "string");
  assert.equal(token.split(".").length, 3, "JWT has 3 parts");
});

test("verifySession returns valid claims for a good token", () => {
  const token = signSession(CLAIMS);
  const result = verifySession(token);
  assert.ok(result);
  assert.equal(result.sub, CLAIMS.sub);
  assert.equal(result.email, CLAIMS.email);
  assert.equal(result.name, CLAIMS.name);
  assert.equal(result.role, CLAIMS.role);
  assert.equal(result.plan, CLAIMS.plan);
});

test("verifySession returns null for an invalid token", () => {
  assert.equal(verifySession("not-a-real-jwt-token"), null);
});

test("verifySession returns null for a token signed with wrong secret", () => {
  const original = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "original-secret-16chars!!!";
  const token = signSession(CLAIMS);

  process.env.AUTH_SECRET = "different-secret-16chars!";
  const result = verifySession(token);
  assert.equal(result, null);

  process.env.AUTH_SECRET = original;
});

test("signSession with missing AUTH_SECRET throws", () => {
  const original = process.env.AUTH_SECRET;
  delete process.env.AUTH_SECRET;
  assert.throws(() => signSession(CLAIMS), /AUTH_SECRET/);
  process.env.AUTH_SECRET = original;
});

test("signSession with short AUTH_SECRET throws", () => {
  const original = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "short";
  assert.throws(() => signSession(CLAIMS), /AUTH_SECRET/);
  process.env.AUTH_SECRET = original;
});
