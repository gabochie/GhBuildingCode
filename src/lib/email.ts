const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

interface BrevoResponse {
  messageId?: string;
}

/**
 * Send transactional email via Brevo (formerly Sendinblue).
 * Requires BREVO_API_KEY and BREVO_SENDER_EMAIL in .env.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@ghbc.gabochie.com";
  const senderName = process.env.BREVO_SENDER_NAME || "GHBC";

  if (!apiKey) {
    console.warn("[email] BREVO_API_KEY not configured — email not sent.");
    return { success: false, error: "Email provider not configured." };
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
        accept: "application/json"
      },
      body: JSON.stringify({
        sender: { email: opts.from || senderEmail, name: opts.fromName || senderName },
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
        ...(opts.text ? { textContent: opts.text } : {})
      })
    });

    const data = await res.json().catch(() => ({})) as BrevoResponse;

    if (!res.ok) {
      const msg = (data as Record<string, unknown>).message || `Brevo API error ${res.status}`;
      console.error("[email] send failed:", msg);
      return { success: false, error: String(msg) };
    }

    return { success: true, messageId: data.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Email send failed";
    console.error("[email]", msg);
    return { success: false, error: msg };
  }
}

/**
 * Build the HTML for a password reset email.
 */
export function passwordResetEmailHtml(resetUrl: string): { subject: string; html: string; text: string } {
  const subject = "Reset your GHBC password";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;">
    <div style="background:#171717;padding:24px 32px;">
      <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">GHBC</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#171717;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
        You requested a password reset for your GHBC account. Click the button below to set a new password. This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#171717;color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Reset Password
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;line-height:1.6;">
        If you did not request this reset, you can safely ignore this email. The link will expire automatically.
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">
        GHBC — Ghana Building Compliance Intelligence
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Reset your GHBC password\n\nYou requested a password reset. Visit this link to set a new password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\n— GHBC`;

  return { subject, html, text };
}
