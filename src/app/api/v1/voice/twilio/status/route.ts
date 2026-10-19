import { NextResponse } from "next/server";
import { getDb, uid, now } from "@/lib/db";
import { clientIp } from "@/lib/api";
import { rateLimit } from "@/lib/security/rate-limit";
import { validateTwilioSignature, formParams } from "@/lib/voice/twilio-signature";

export async function POST(req: Request) {
  const form = await req.formData();

  // Only Twilio can sign the request; fail closed if unconfigured or invalid.
  const signatureOk = validateTwilioSignature({
    authToken: process.env.TWILIO_AUTH_TOKEN,
    signature: req.headers.get("x-twilio-signature"),
    url: req.url,
    params: formParams(form)
  });
  if (!signatureOk) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const rl = await rateLimit("voice", clientIp(req));
  if (!rl.allowed) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const callSid = form.get("CallSid") as string;
  const status = form.get("CallStatus") as string;
  const duration = form.get("CallDuration") as string;

  if (callSid) {
    try {
      const db = await getDb();
      await db.prepare(
        "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, NULL, 'voice_call', 'call', ?, ?)"
      ).run(uid("aud"), callSid, JSON.stringify({ status, duration: duration ?? null, ended_at: now() }));
    } catch {
      // non-critical — swallow
    }
  }

  return new NextResponse("OK", { status: 200 });
}
