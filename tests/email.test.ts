import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordResetEmailHtml, sendEmail } from "../src/lib/email.ts";

test("passwordResetEmailHtml returns subject, html, and text", () => {
  const result = passwordResetEmailHtml("http://localhost:3000/reset-password/abc123");
  assert.equal(typeof result.subject, "string");
  assert.ok(result.subject.includes("Reset"));
  assert.ok(result.html.includes("Reset Password"));
  assert.ok(result.html.includes("http://localhost:3000/reset-password/abc123"));
  assert.ok(result.text.includes("http://localhost:3000/reset-password/abc123"));
});

test("passwordResetEmailHtml includes expiry warning", () => {
  const result = passwordResetEmailHtml("http://example.com/reset/x");
  assert.ok(result.html.includes("1 hour"));
  assert.ok(result.text.includes("1 hour"));
});

test("sendEmail returns error when BREVO_API_KEY is not set", async () => {
  const original = process.env.BREVO_API_KEY;
  delete process.env.BREVO_API_KEY;
  const result = await sendEmail({ to: "test@example.com", subject: "Test", html: "<p>Hi</p>" });
  assert.equal(result.success, false);
  assert.ok(result.error);
  process.env.BREVO_API_KEY = original;
});
