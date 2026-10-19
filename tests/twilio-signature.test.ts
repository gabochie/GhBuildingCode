import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validateTwilioSignature, formParams } from "../src/lib/voice/twilio-signature.ts";

const AUTH = "test-auth-token";
const URL_ = "https://ghbc.gabochie.com/api/v1/voice/twilio/webhook?action=ask";
const PARAMS = { CallSid: "CA123", From: "+233200000000", SpeechResult: "hello", action: "ask" };

function sign(token: string, url: string, params: Record<string, string>): string {
  let data = url;
  for (const k of Object.keys(params).sort()) data += k + params[k];
  return createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");
}

test("validateTwilioSignature accepts a correctly signed request", () => {
  const signature = sign(AUTH, URL_, PARAMS);
  assert.equal(validateTwilioSignature({ authToken: AUTH, signature, url: URL_, params: PARAMS }), true);
});

test("validateTwilioSignature rejects tampered params, wrong token and missing inputs", () => {
  const signature = sign(AUTH, URL_, PARAMS);
  const tampered = { ...PARAMS, SpeechResult: "tampered" };
  assert.equal(validateTwilioSignature({ authToken: AUTH, signature, url: URL_, params: tampered }), false);
  assert.equal(validateTwilioSignature({ authToken: "other", signature, url: URL_, params: PARAMS }), false);
  assert.equal(validateTwilioSignature({ authToken: AUTH, signature, url: URL_ + "&x=1", params: PARAMS }), false);
  assert.equal(validateTwilioSignature({ authToken: undefined, signature, url: URL_, params: PARAMS }), false);
  assert.equal(validateTwilioSignature({ authToken: AUTH, signature: null, url: URL_, params: PARAMS }), false);
});

test("formParams flattens a FormData body to strings", () => {
  const form = new FormData();
  form.set("CallSid", "CA1");
  form.set("SpeechResult", "hi");
  assert.deepEqual(formParams(form), { CallSid: "CA1", SpeechResult: "hi" });
});
