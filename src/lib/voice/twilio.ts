const VOICE = "Polly.Matthew";

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function twiml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${body}\n</Response>`, {
    headers: { "Content-Type": "text/xml" }
  });
}

export function say(text: string): string {
  return `<Say voice="${VOICE}">${escapeXml(text)}</Say>`;
}

export function gather(action: string, prompt: string, opts: { method?: string; input?: string; language?: string; speechTimeout?: string } = {}): string {
  const { method = "POST", input = "speech", language = "en-GH", speechTimeout = "auto" } = opts;
  return `<Gather input="${input}" action="${escapeXml(action)}" method="${method}" language="${language}" speechTimeout="${speechTimeout}">\n  ${say(prompt)}\n</Gather>`;
}

export function redirect(url: string): string {
  return `<Redirect method="POST">${escapeXml(url)}</Redirect>`;
}

export function hangup(): string {
  return `<Hangup/>`;
}

export function greeting(actionUrl: string): Response {
  return twiml(
    say("Welcome to GHBC, the Ghana Building Compliance Intelligence line.") +
    gather(actionUrl, "What building compliance question can I help you with today?")
  );
}

export function answerAndContinue(answerText: string, actionUrl: string): Response {
  return twiml(
    say(answerText) +
    gather(actionUrl, "Is there anything else you would like to know?")
  );
}

export function leadCaptureIntro(actionUrl: string): Response {
  return twiml(
    say("I can connect you with our team for a detailed consultation.") +
    gather(actionUrl, "Please say your full name after the beep.", { speechTimeout: "3s" })
  );
}

export function leadCaptureEmail(actionUrl: string): Response {
  return twiml(
    say("Thank you. Now please say your email address.") +
    gather(actionUrl, "For example, name at example dot com.", { speechTimeout: "3s" })
  );
}

export function leadCapturePhone(actionUrl: string): Response {
  return twiml(
    say("Got it. Finally, please say your phone number.") +
    gather(actionUrl, "You can skip this by saying skip.", { speechTimeout: "3s" })
  );
}

export function leadCaptureConfirm(name: string, email: string): Response {
  return twiml(
    say(`Thank you, ${name}. Our team will reach out to you at ${email}. Is there anything else I can help with?`) +
    gather("/api/v1/voice/twilio/webhook", "Ask another question or say goodbye.")
  );
}

export function goodbye(): Response {
  return twiml(
    say("Thank you for calling GHBC. Have a great day.") +
    hangup()
  );
}
