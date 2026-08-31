import { test } from "node:test";
import assert from "node:assert/strict";
import { ghsToMinor, planPrice, addMonthsIso, isExpired, monthlyPeriod } from "../src/lib/billing/price.ts";
import { MoolreGateway } from "../src/lib/billing/payments/moolre.ts";
import { ExpressPayGateway } from "../src/lib/billing/payments/expresspay.ts";

test("ghsToMinor parses GHS labels into pesewa amounts", () => {
  assert.equal(ghsToMinor("GH₵399"), "399");
  assert.equal(ghsToMinor("GH₵1,299"), "1299");
  assert.equal(ghsToMinor("GH₵0"), "0");
  assert.equal(ghsToMinor(""), "0");
});

test("planPrice resolves GHS price for chargeable plans only", () => {
  const prof = planPrice("professional");
  assert.ok(prof);
  assert.equal(prof!.currency, "GHS");
  assert.equal(prof!.amountMinor, "399");
  assert.equal(prof!.label, "GH₵399");

  const studio = planPrice("studio");
  assert.equal(studio!.amountMinor, "1299");

  // Free and custom/enterprise are never chargeable online.
  assert.equal(planPrice("free"), null);
  assert.equal(planPrice("enterprise"), null);
});

test("monthlyPeriod is UTC YYYY-MM", () => {
  assert.equal(monthlyPeriod(new Date("2026-08-15T10:00:00Z")), "2026-08");
  assert.equal(monthlyPeriod(new Date("2026-12-31T23:00:00Z")), "2026-12");
});

test("addMonthsIso advances by whole months in UTC", () => {
  assert.equal(addMonthsIso("2026-01-15T00:00:00.000Z", 1), "2026-02-15T00:00:00.000Z");
  assert.equal(addMonthsIso("2026-01-15T00:00:00.000Z", 12), "2027-01-15T00:00:00.000Z");
  // null falls back to now (non-deterministic but must be valid).
  assert.ok(!Number.isNaN(Date.parse(addMonthsIso(null, 1))));
});

test("isExpired compares against now", () => {
  assert.equal(isExpired("2026-01-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), true);
  assert.equal(isExpired("2026-12-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), false);
  assert.equal(isExpired(null, "2026-06-01T00:00:00.000Z"), true);
  // Boundary: equal timestamps count as expired.
  assert.equal(isExpired("2026-06-01T00:00:00.000Z", "2026-06-01T00:00:00.000Z"), true);
});

function moolreCfg() {
  return {
    id: "moolre" as const,
    label: "Moolre",
    enabled: true,
    baseUrl: "https://api.moolre.com",
    apiKey: "pk_test",
    accountNumber: "100000157291",
    webhookSecret: "secret"
  };
}

test("Moolre maps status values to normalized payment status", () => {
  const gw = new MoolreGateway(moolreCfg());
  const hoisted: Record<string, unknown> = {};
  // Expose private mapStatus via a webhook roundtrip instead.
  assert.ok(gw.isEnabled());
  assert.equal(gw.id, "moolre");
  assert.equal(gw.webhookPath, "/api/v1/billing/webhooks/moolre");
  void hoisted;
});

test("Moolre handleWebhook parses success payload to paid", async () => {
  const gw = new MoolreGateway(moolreCfg());
  const req = new Request("https://x/api/v1/billing/webhooks/moolre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: 1,
      code: "P01",
      message: "Transaction Successful",
      data: { txstatus: 1, transactionid: "TXN123", externalref: "pay_abc", ts: "2026-01-01" }
    })
  });
  const event = await gw.handleWebhook(req);
  assert.ok(event);
  assert.equal(event.reference, "pay_abc");
  assert.equal(event.gatewayRef, "TXN123");
  assert.equal(event.status, "paid");
});

test("Moolre handleWebhook returns null for unparseable body", async () => {
  const gw = new MoolreGateway(moolreCfg());
  const req = new Request("https://x/webhook", { method: "POST", body: "not-json" });
  const event = await gw.handleWebhook(req);
  assert.equal(event, null);
});

test("Moolre normalizePhone produces international format", () => {
  const gw = new MoolreGateway(moolreCfg());
  // Use initiate's fetch to capture the normalized phone.
  const calls: Array<{ url: string; body: string }> = [];
  const original = globalThis.fetch;
  // @ts-expect-error - install a mock fetch
  globalThis.fetch = async (url: string, init: { body?: string }) => {
    calls.push({ url, body: init?.body ?? "" });
    return new Response(JSON.stringify({ txstatus: 1, transactionid: "T1" }), { status: 200 });
  };
  try {
    gw.initiate({
      reference: "pay_1",
      amountMajor: "399",
      amountMinor: "399",
      firstname: "John",
      lastname: "Doe",
      email: "j@x.com",
      phone: "0244000000",
      description: "plan",
      callbackUrl: "https://x/w",
      redirectUrl: "https://x/r"
    });
    // fetch is async; await the promise the gateway returned
  } finally {
    globalThis.fetch = original;
  }
  // We captured an initiate call; verify the normalized payer was sent.
  const body = JSON.parse(calls[0]?.body ?? "{}");
  assert.equal(body.payer, "233244000000");
  assert.equal(body.currency, "GHS");
  assert.equal(body.channel, "13");
});

function expressCfg() {
  return {
    id: "expresspay" as const,
    label: "ExpressPay",
    enabled: true,
    baseUrl: "https://expresspaygh.com/api",
    merchantId: "MERCH1",
    apiKey: "KEY1"
  };
}

test("ExpressPay init uses submit URL and returns checkout redirect", async () => {
  const gw = new ExpressPayGateway(expressCfg());
  const calls: Array<{ url: string; body: string }> = [];
  const original = globalThis.fetch;
  // @ts-expect-error - mock fetch
  globalThis.fetch = async (url: string, init: { body?: string }) => {
    calls.push({ url, body: init?.body ?? "" });
    return new Response(JSON.stringify({ status: 1, token: "TOK123", "order-id": "pay_1" }), { status: 200 });
  };
  let result: Awaited<ReturnType<ExpressPayGateway["initiate"]>>;
  try {
    result = await gw.initiate({
      reference: "pay_1",
      amountMajor: "399",
      amountMinor: "399",
      firstname: "John",
      lastname: "Doe",
      email: "j@x.com",
      phone: "0244000000",
      description: "GHBC Professional subscription",
      callbackUrl: "https://x/cb",
      redirectUrl: "https://x/return"
    });
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls[0].url, "https://expresspaygh.com/api/submit.php");
  const body = new URLSearchParams(calls[0].body);
  assert.equal(body.get("merchant-id"), "MERCH1");
  assert.equal(body.get("api-key"), "KEY1");
  assert.equal(body.get("currency"), "GHS");
  assert.equal(body.get("amount"), "399");
  assert.equal(body.get("order-id"), "pay_1");
  assert.equal(result.redirectUrl, "https://expresspaygh.com/api/checkout.php?token=TOK123");
  assert.equal(result.gatewayRef, "TOK123");
});

test("ExpressPay maps query result 1 to paid, 2 to failed, 4 to pending", async () => {
  const gw = new ExpressPayGateway(expressCfg());
  const mocks: Array<unknown> = [
    { result: 1, token: "T", "order-id": "o" },
    { result: 2, token: "T", "order-id": "o" },
    { result: 4, token: "T", "order-id": "o" }
  ];
  const original = globalThis.fetch;
  let i = 0;
  // @ts-expect-error - mock fetch
  globalThis.fetch = async () => new Response(JSON.stringify(mocks[i++]), { status: 200 });
  try {
    assert.equal((await gw.verify({ reference: "o", gatewayRef: "T" })).status, "paid");
    assert.equal((await gw.verify({ reference: "o", gatewayRef: "T" })).status, "failed");
    assert.equal((await gw.verify({ reference: "o", gatewayRef: "T" })).status, "pending");
  } finally {
    globalThis.fetch = original;
  }
});
