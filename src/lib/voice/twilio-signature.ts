import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validate a Twilio webhook request signature (X-Twilio-Signature).
 *
 * Twilio signs each request by taking the full request URL, appending every
 * POST parameter sorted by key as `key + value` (with no separators), and
 * HMAC-SHA1-ing the result with the account auth token (base64). When a proxy
 * terminates TLS in front of us the URL Twilio signed is the one configured on
 * the number, so callers should pass the request URL as received.
 *
 * Returns false when the auth token or signature is absent — callers should
 * fail closed (403) in that case.
 */
export function validateTwilioSignature(opts: {
  authToken: string | undefined;
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  const { authToken, signature, url, params } = opts;
  if (!authToken || !signature) return false;

  let data = url;
  for (const key of Object.keys(params).sort()) {
    data += key + params[key];
  }

  const expected = createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/** Collect a FormData body into a plain string record for signature checks. */
export function formParams(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
