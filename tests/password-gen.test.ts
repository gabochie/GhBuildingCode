import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePassword } from "../src/lib/password-gen.ts";

test("generatePassword returns default 16 characters", () => {
  const pw = generatePassword();
  assert.equal(pw.length, 16);
});

test("generatePassword respects custom length", () => {
  assert.equal(generatePassword(8).length, 8);
  assert.equal(generatePassword(32).length, 32);
  assert.equal(generatePassword(128).length, 128);
});

test("generatePassword contains at least one uppercase letter", () => {
  const pw = generatePassword();
  assert.ok(/[A-Z]/.test(pw), `expected uppercase in "${pw}"`);
});

test("generatePassword contains at least one lowercase letter", () => {
  const pw = generatePassword();
  assert.ok(/[a-z]/.test(pw), `expected lowercase in "${pw}"`);
});

test("generatePassword contains at least one digit", () => {
  const pw = generatePassword();
  assert.ok(/[0-9]/.test(pw), `expected digit in "${pw}"`);
});

test("generatePassword contains at least one symbol", () => {
  const pw = generatePassword();
  assert.ok(/[!@#$%^&*\-_=+?]/.test(pw), `expected symbol in "${pw}"`);
});

test("generatePassword uses only valid characters", () => {
  const VALID = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*-_=+?";
  for (let i = 0; i < 20; i++) {
    const pw = generatePassword(32);
    for (const ch of pw) {
      assert.ok(VALID.includes(ch), `invalid char "${ch}" in "${pw}"`);
    }
  }
});

test("generatePassword produces different results each call", () => {
  const results = new Set(Array.from({ length: 10 }, () => generatePassword()));
  assert.ok(results.size > 1, "expected at least 2 unique passwords out of 10");
});
