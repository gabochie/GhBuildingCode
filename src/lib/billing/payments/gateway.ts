import type { GatewayId } from "./config";

/** Normalized state shared across all Ghana gateways. */
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface InitiateResult {
  /** Where to send the customer (redirect URL, or a "please approve on phone" message for MoMo). */
  redirectUrl: string | null;
  /** Gateway-native transaction id (may be null until confirmed). */
  gatewayRef: string | null;
  /** For mobile-money flows: a short instruction shown to the user. */
  message?: string;
}

export interface VerifyResult {
  status: PaymentStatus;
  /** Gateway transaction id. */
  gatewayRef: string | null;
  /** Confirmed amount in minor currency (pesewas) if the gateway reports it. */
  amountMinor?: string;
}

/** A verified payment notification from a gateway webhook. */
export interface WebhookEvent {
  gateway: GatewayId;
  /** Our internal reference (order id / external ref). */
  reference: string;
  /** Gateway transaction id (may be null). */
  gatewayRef: string | null;
  status: PaymentStatus;
  amountMinor?: string;
  /** Raw payload forwarded for auditing. */
  raw: unknown;
}

export interface PaymentGateway {
  id: GatewayId;
  /** True when required env secrets are present. */
  isEnabled(): boolean;
  /** Initiate a payment for an amount in GHS. */
  initiate(opts: {
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
  }): Promise<InitiateResult>;
  /** Query the gateway for the current status of a transaction. */
  verify(opts: { reference: string; gatewayRef: string | null }): Promise<VerifyResult>;
  /** Validate an incoming webhook and extract the normalized event. Returns null if invalid. */
  handleWebhook(req: Request): Promise<WebhookEvent | null>;
  /** Webhook URL path this gateway posts to (e.g. /api/v1/billing/webhooks/moolre). */
  webhookPath: string;
}
