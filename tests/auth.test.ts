import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, validateEmail, validatePasswordStrength } from "../src/lib/auth/password.ts";

test("hashPassword produces a bcrypt hash", async () => {
  const hash = await hashPassword("TestPassword123!");
  assert.ok(typeof hash === "string");
  assert.ok(hash.startsWith("$2"), "should start with bcrypt prefix");
  assert.ok(hash.length > 50, "bcrypt hash should be long");
});

test("verifyPassword returns true for correct password", async () => {
  const hash = await hashPassword("MySecret99!");
  assert.equal(await verifyPassword("MySecret99!", hash), true);
});

test("verifyPassword returns false for wrong password", async () => {
  const hash = await hashPassword("MySecret99!");
  assert.equal(await verifyPassword("WrongPassword!", hash), false);
});

test("validateEmail accepts valid addresses", () => {
  assert.equal(validateEmail("user@example.com"), true);
  assert.equal(validateEmail("name.last@domain.co.uk"), true);
  assert.equal(validateEmail("test+tag@gmail.com"), true);
  assert.equal(validateEmail("a@b.c"), true);
});

test("validateEmail rejects invalid addresses", () => {
  assert.equal(validateEmail(""), false);
  assert.equal(validateEmail("no-at-sign"), false);
  assert.equal(validateEmail("@no-local.com"), false);
  assert.equal(validateEmail("no-local-part@"), false);
  assert.equal(validateEmail("missing-at-sign.com"), false);
});

test("validatePasswordStrength accepts passwords >= 8 chars", () => {
  assert.equal(validatePasswordStrength("12345678"), null);
  assert.equal(validatePasswordStrength("abcdefghij"), null);
  assert.equal(validatePasswordStrength("A".repeat(128)), null);
});

test("validatePasswordStrength rejects short passwords", () => {
  assert.match(validatePasswordStrength("short")!, /at least 8/);
  assert.match(validatePasswordStrength("1234567")!, /at least 8/);
});

test("validatePasswordStrength rejects overly long passwords", () => {
  assert.match(validatePasswordStrength("A".repeat(129))!, /at most 128/);
});
