import { moolreConfig, type MoolreConfig } from "./config";
import type { PaymentGateway, InitiateResult, VerifyResult, WebhookEvent } from "./gateway";
import type { PaymentStatus } from "./gateway";

/**
 * Moolre gateway client.
 *
 * Moolre is a Ghanaian mobile-money aggregator: initiating a payment sends a
 * USSD prompt to the payer's phone for PIN approval, debiting their MTN /
 * Telecel / AirtelTigo MoMo account into the merchant wallet. Status is
 * delivered asynchronously via webhook and can be queried.
 *
 * Auth uses the public key header (`X-API-PUBKEY`). All values are read from
 * server-side env (see config.ts).
 */
export class MoolreGateway implements PaymentGateway {
  id = "moolre" as const;
  webhookPath = "/api/v1/billing/webhooks/moolre";

  constructor(private cfg: MoolreConfig = moolreConfig()!) {}

  isEnabled(): boolean {
    return !!this.cfg && this.cfg.enabled;
  }

  private async request(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const base = this.cfg.baseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-PUBKEY": this.cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) {
      throw new Error(`Moolre request failed (${res.status})`);
    }
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
    if (!this.isEnabled()) throw new Error("Moolre gateway is not configured.");
    // channel 13 = MoMo (validated from Moolre collection API docs)
    const payload = {
      type: 1,
      channel: "13",
      currency: "GHS",
      payer: this.normalizePhone(opts.phone),
      amount: opts.amountMajor,
      externalref: opts.reference,
      reference: opts.description,
      callbackurl: opts.callbackUrl,
      accountnumber: this.cfg.accountNumber,
      redirecturl: opts.redirectUrl
    };
    const data = await this.request("/open/transact/payment", payload);
    const gatewayRef = this.readString(data, ["transactionid", "transaction_id", "reference", "id"]);
    return {
      redirectUrl: null,
      gatewayRef,
      message: "An MTN/Telecel/AirtelTigo Mobile Money prompt has been sent to your phone. Approve it with your PIN to complete payment."
    };
  }

  async verify(opts: { reference: string; gatewayRef: string | null }): Promise<VerifyResult> {
    if (!this.isEnabled()) throw new Error("Moolre gateway is not configured.");
    const data = await this.request("/open/transact/verify", {
      externalref: opts.reference,
      transactionid: opts.gatewayRef ?? undefined
    });
    const txstatus = this.readString(data, ["txstatus", "status"]);
    return {
      status: this.mapStatus(txstatus),
      gatewayRef: this.readString(data, ["transactionid", "transaction_id"]) ?? opts.gatewayRef,
      amountMinor: this.readString(data, ["amount", "amount_minor"]) ?? undefined
    };
  }

  async handleWebhook(req: Request): Promise<WebhookEvent | null> {
    const raw = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!raw) return null;
    // webhook payload documented as: { status, code, message, data: { txstatus, transactionid, externalref, ts } }
    const data = (raw.data ?? raw) as Record<string, unknown>;
    const reference = this.readString(raw, ["externalref", "order_ref", "reference"]) ?? this.readString(data, ["externalref", "reference"]);
    if (!reference) return null;
    const statusRaw = this.readString(data, ["txstatus", "status"]);
    return {
      gateway: "moolre",
      reference,
      gatewayRef: this.readString(data, ["transactionid", "transaction_id"]) ?? null,
      status: this.mapStatus(statusRaw),
      amountMinor: this.readString(data, ["amount", "amount_minor"]) ?? undefined,
      raw
    };
  }

  private mapStatus(raw: string | null | undefined): PaymentStatus {
    const v = (raw ?? "").toString().trim().toLowerCase();
    if (["1", "success", "approved", "successful", "paid", "completed"].includes(v)) return "paid";
    if (["2", "failed", "declined", "error"].includes(v)) return "failed";
    return "pending";
  }

  private readString(obj: Record<string, unknown>, keys: string[]): string | null {
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
    return null;
  }

  /** Normalize a Ghanaian phone to international +233 format for the gateway. */
  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("233")) return `233${digits.slice(3)}`;
    if (digits.startsWith("0")) return `233${digits.slice(1)}`;
    return digits || "233000000000";
  }
}
