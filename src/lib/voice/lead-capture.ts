import { getDb, uid, now } from "@/lib/db";
import { validateEmail } from "@/lib/auth/password";

export interface LeadInput {
  user_id?: string;
  name?: string;
  email: string;
  phone?: string;
  organization?: string;
  source: "marketing_form" | "voice_browser" | "voice_phone";
  channel: "web" | "voice" | "phone";
  interest?: string;
  message?: string;
  voice_session_id?: string;
}

export function saveLead(input: LeadInput): { id: string } {
  if (!validateEmail(input.email)) throw new Error("Invalid email address.");
  const id = uid("lead");
  const db = getDb();
  db.prepare(
    `INSERT INTO leads (id, user_id, name, email, phone, organization, source, channel, interest, message, voice_session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.user_id ?? null,
    input.name?.trim() ?? null,
    input.email.trim().toLowerCase(),
    input.phone?.trim() ?? null,
    input.organization?.trim() ?? null,
    input.source,
    input.channel,
    input.interest?.trim() ?? null,
    input.message?.trim() ?? null,
    input.voice_session_id ?? null
  );
  return { id };
}
