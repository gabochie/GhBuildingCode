import { NextResponse } from "next/server";
import { getDb, uid, now } from "@/lib/db";
import { answerQuestion } from "@/lib/ai/rag";
import { saveLead } from "@/lib/voice/lead-capture";
import {
  twiml,
  say,
  gather,
  answerAndContinue,
  leadCaptureIntro,
  leadCaptureEmail,
  leadCapturePhone,
  leadCaptureConfirm,
  goodbye
} from "@/lib/voice/twilio";

function speechResult(formData: FormData): string {
  return (formData.get("SpeechResult") as string ?? "").trim();
}

function callSid(formData: FormData): string {
  return (formData.get("CallSid") as string ?? "unknown");
}

function callerPhone(formData: FormData): string {
  return (formData.get("From") as string ?? "").replace("tel:+", "+");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const action = (form.get("action") as string) || "ask";
  const db = await getDb();
  const phone = callerPhone(form);
  const csid = callSid(form);

  if (action === "lead_name") {
    const name = speechResult(form);
    const leadId = uid("lead");
    await db.prepare(
      `INSERT INTO leads (id, name, email, phone, source, channel, voice_session_id, status)
       VALUES (?, ?, '', ?, 'voice_phone', 'phone', ?, 'new')`
    ).run(leadId, name || "Unknown", phone || null, csid);
    const url = new URL(req.url);
    url.searchParams.set("action", "lead_email");
    url.searchParams.set("lead_id", leadId);
    url.searchParams.set("name", name);
    return leadCaptureEmail(url.pathname + "?" + url.searchParams.toString());
  }

  if (action === "lead_email") {
    const email = speechResult(form).replace(/\s+at\s+/gi, "@").replace(/\s+dot\s+/gi, ".").replace(/\s/g, "");
    const leadId = form.get("lead_id") as string;
    const name = form.get("name") as string;
    if (leadId) {
      await db.prepare("UPDATE leads SET email = ? WHERE id = ?").run(email, leadId);
    }
    const url = new URL(req.url);
    url.searchParams.set("action", "lead_phone");
    url.searchParams.set("lead_id", leadId || "");
    url.searchParams.set("name", name || "");
    url.searchParams.set("email", email);
    return leadCapturePhone(url.pathname + "?" + url.searchParams.toString());
  }

  if (action === "lead_phone") {
    const phoneInput = speechResult(form);
    const leadId = form.get("lead_id") as string;
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    if (leadId && phoneInput.toLowerCase() !== "skip") {
      await db.prepare("UPDATE leads SET phone = ? WHERE id = ?").run(phoneInput, leadId);
    }
    return leadCaptureConfirm(name || "there", email || "");
  }

  if (action === "goodbye") {
    return goodbye();
  }

  const question = speechResult(form);
  if (!question) {
    return twiml(
      say("I did not catch that. Could you please repeat your question?") +
      gather("/api/v1/voice/twilio/webhook", "What would you like to know about the Ghana Building Code?")
    );
  }

  let answerText: string;
  try {
    const answer = await answerQuestion(question);
    answerText = answer.content;
    if (answer.citations.length) {
      const refs = answer.citations.slice(0, 2).map(c => `${c.source_document} Part ${c.part}`).join(" and ");
      answerText += ` Sources: ${refs}.`;
    }
  } catch {
    answerText = "I am sorry, I could not process that question right now. Please try again.";
  }

  const turnCount = parseInt(form.get("turns") as string || "0", 10) + 1;

  if (turnCount >= 3 && !form.get("lead_asked")) {
    const url = new URL(req.url);
    url.searchParams.set("action", "lead_name");
    return leadCaptureIntro(url.pathname + "?" + url.searchParams.toString());
  }

  return answerAndContinue(answerText, "/api/v1/voice/twilio/webhook?turns=" + turnCount);
}
