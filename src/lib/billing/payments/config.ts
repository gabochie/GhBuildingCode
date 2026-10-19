export type GatewayId = "moolre" | "expresspay";

/**
 * Gateway configuration resolved from environment variables.
 * All values are server-side secrets that must never reach the client.
 */
export interface GatewayConfig {
  id: GatewayId;
  label: string;
  enabled: boolean;
  baseUrl: string;
}

export interface MoolreConfig extends GatewayConfig {
  apiKey: string;
  accountNumber: string;
  webhookSecret: string;
}

export interface ExpressPayConfig extends GatewayConfig {
  merchantId: string;
  apiKey: string;
}

function env(key: string): string | undefined {
  return process.env[key];
}

function isConfigured(...vals: Array<string | undefined>): boolean {
  return vals.every((v) => !!v && v.trim().length > 0);
}

export function moolreConfig(overrides: Record<string, string> = {}): MoolreConfig | null {
  const apiKey = overrides.apiKey ?? env("MOOLRE_API_KEY") ?? "";
  const accountNumber = overrides.accountNumber ?? env("MOOLRE_ACCOUNT_NUMBER") ?? "";
  const webhookSecret = overrides.webhookSecret ?? env("MOOLRE_WEBHOOK_SECRET") ?? "";
  // The callback secret is required: without it a webhook cannot be
  // authenticated, so the gateway is not considered usable at all.
  const enabled = isConfigured(apiKey, accountNumber, webhookSecret);
  return {
    id: "moolre",
    label: "Moolre (MoMo)",
    enabled,
    baseUrl: env("MOOLRE_BASE_URL") ?? "https://api.moolre.com",
    apiKey,
    accountNumber,
    webhookSecret
  };
}

export function expressPayConfig(overrides: Record<string, string> = {}): ExpressPayConfig | null {
  const merchantId = overrides.merchantId ?? env("EXPRESSPAY_MERCHANT_ID") ?? "";
  const apiKey = overrides.apiKey ?? env("EXPRESSPAY_API_KEY") ?? "";
  const enabled = isConfigured(merchantId, apiKey);
  return {
    id: "expresspay",
    label: "ExpressPay (cards · MoMo · gh-link)",
    enabled,
    baseUrl: env("EXPRESSPAY_BASE_URL") ?? "https://expresspaygh.com/api",
    merchantId,
    apiKey
  };
}

/** Return all gateways that are configured and enabled. */
export function enabledGateways(): Array<GatewayConfig> {
  const out: GatewayConfig[] = [];
  const m = moolreConfig();
  if (m?.enabled) out.push(m);
  const e = expressPayConfig();
  if (e?.enabled) out.push(e);
  return out;
}
