import { NextResponse } from "next/server";
import { getDb, uid, now } from "@/lib/db";

export async function POST(req: Request) {
  const form = await req.formData();
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
