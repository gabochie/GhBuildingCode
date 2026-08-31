import { expressPayConfig, type ExpressPayConfig } from "./config";
import type { PaymentGateway, InitiateResult, VerifyResult, WebhookEvent } from "./gateway";
import type { PaymentStatus } from "./gateway";

/**
 * ExpressPay (expressPay.Ghana Pay) gateway client.
 *
 * Flow (Merchant API):
 *  1. POST /api/submit.php (form-urlencoded) -> returns { status, token, order-id }
 *  2. Redirect customer to /api/checkout.php?token=... (hosted payment page)
 *  3. On completion, gateway redirects browser to redirect-url and POSTs to
 *     post-url (required for mobile money). Both carry order-id + token.
 *  4. Merchant verifies with POST /api/query.php using merchant-id/api-key/token;
 *     result === 1 means paid.
 *
 * Because the basic Merchant API does not provide a signed body, verification is
 * always server-authoritative via query.php. The webhook merely carries the token
 * that proves a transaction needs re-checking (matches the documented flow).
 */
export class ExpressPayGateway implements PaymentGateway {
  id = "expresspay" as const;
  webhookPath = "/api/v1/billing/webhooks/expresspay";

  constructor(private cfg: ExpressPayConfig = expressPayConfig()!) {}

  isEnabled(): boolean {
    return !!this.cfg && this.cfg.enabled;
  }

  private get submitUrl() {
    return `${this.cfg.baseUrl.replace(/\/$/, "")}/submit.php`;
  }

  private get queryUrl() {
    return `${this.cfg.baseUrl.replace(/\/$/, "")}/query.php`;
  }

  private get checkoutUrl() {
    return `${this.cfg.baseUrl.replace(/\/$/, "")}/checkout.php`;
  }

  private async postForm(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
    const body = new URLSearchParams(params);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`ExpressPay request failed (${res.status})`);
    return (await res.json().catch(() => ({}))) as Record<string, unknown>;
  }

  async initiate(opts: {
    reference: string;
    amountMajor: string;
    amountMinor: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    description: string;
    callbackUrl: string;
    redirectUrl: string;
  }): Promise<InitiateResult> {
    if (!this.isEnabled()) throw new Error("ExpressPay gateway is not configured.");
    const resp = await this.postForm(this.submitUrl, {
      "merchant-id": this.cfg.merchantId,
      "api-key": this.cfg.apiKey,
      firstname: opts.firstname.slice(0, 32),
      lastname: opts.lastname.slice(0, 64),
      email: opts.email.slice(0, 64),
      phonenumber: opts.phone.slice(0, 64),
      username: opts.email.slice(0, 64),
      currency: "GHS",
      amount: opts.amountMajor,
      "order-id": opts.reference,
      "order-desc": opts.description.slice(0, 256),
      "redirect-url": opts.redirectUrl,
      "post-url": opts.callbackUrl
    });

    if (String(resp.status) !== "1") {
      throw new Error(`ExpressPay rejected payment (status ${resp.status}).`);
    }
    const token = String(resp.token ?? "");
    if (!token) throw new Error("ExpressPay returned no checkout token.");
    return {
      redirectUrl: `${this.checkoutUrl}?token=${encodeURIComponent(token)}`,
      gatewayRef: token
    };
  }

  async verify(opts: { reference: string; gatewayRef: string | null }): Promise<VerifyResult> {
    if (!this.isEnabled()) throw new Error("ExpressPay gateway is not configured.");
    if (!opts.gatewayRef) throw new Error("ExpressPay verify requires a token.");
    const resp = await this.postForm(this.queryUrl, {
      "merchant-id": this.cfg.merchantId,
      "api-key": this.cfg.apiKey,
      token: opts.gatewayRef
    });
    return {
      status: this.mapStatus(String(resp.result)),
      gatewayRef: opts.gatewayRef,
      amountMinor: String(resp.amount ?? "").length ? String(resp.amount) : undefined
    };
  }

  async handleWebhook(req: Request): Promise<WebhookEvent | null> {
    // post-url receives order-id + token (may be form or query). Verification is
    // done server-authoritatively via query.php by the caller.
    const url = new URL(req.url);
    let orderId: string | null = url.searchParams.get("order-id");
    let token: string | null = url.searchParams.get("token");
    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData().catch(() => new FormData());
      orderId = orderId ?? (form.get("order-id") as string | null);
      token = token ?? (form.get("token") as string | null);
    }
    if (!orderId || !token) return null;
    return {
      gateway: "expresspay",
      reference: orderId,
      gatewayRef: token,
      status: "pending", // caller re-queries to obtain authoritative status
      raw: { orderId, token }
    };
  }

  private mapStatus(result: string): PaymentStatus {
    if (result === "1") return "paid";
    if (result === "2" || result === "3") return "failed";
    return "pending";
  }
}
