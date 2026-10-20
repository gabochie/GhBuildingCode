/**
 * Sanitize + verify the Cloudflare worker artifact before shipping.
 *
 * OpenNext inlines the project's env files (`.env`, `.env.local`, …) into
 * `.open-next/cloudflare/next-env.mjs` for every mode, regardless of NODE_ENV.
 * That means local development secrets (dev AUTH_SECRET, the default admin
 * password, Clerk development keys, localhost URLs) can silently ship to
 * production. This script removes those values from the artifact and then
 * refuses the build if any leak remains.
 *
 * Secrets (AUTH_SECRET, CLERK_SECRET_KEY, GHBC_ADMIN_PASSWORD, API keys) must
 * come from Worker secrets at runtime — never from the baked fallback.
 *
 * Run as part of `deploy`/`upload`/`preview`. Exits non-zero on any residual hit.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const nextEnvPath = resolve(root, ".open-next/cloudflare/next-env.mjs");

// Keys that must never be baked into the artifact — they belong in Worker secrets.
const SECRET_KEYS = [
  "AUTH_SECRET",
  "CLERK_SECRET_KEY",
  "GHBC_ADMIN_PASSWORD",
  "AI_API_KEY",
  "AI_FALLBACK_API_KEY",
  "TWILIO_AUTH_TOKEN",
  "BREVO_API_KEY",
  "MOOLRE_API_KEY",
  "MOOLRE_WEBHOOK_SECRET",
  "EXPRESSPAY_API_KEY",
  "CRON_SECRET"
];

// Values that must never appear anywhere in the artifact.
const FORBIDDEN = [
  { needle: "ghbc-local-dev-secret", label: "dev AUTH_SECRET" },
  { needle: "ChangeMe123!", label: "default admin password" },
  { needle: "pk_test_", label: "Clerk development publishable key" },
  { needle: "sk_test_", label: "Clerk development secret key" },
  { needle: "http://localhost", label: "localhost URL" },
  { needle: "localhost:3000", label: "localhost:3000 URL" },
  { needle: "BCGH\\ghbc-corpus", label: "local corpus path" },
  { needle: "BCGH/ghbc-corpus", label: "local corpus path" },
  { needle: "REPLACE_WITH_", label: "unresolved placeholder value" }
];

// Scan the compiled worker bundle too (it may inline env values).
const BUNDLE_TARGETS = [".open-next/worker.js", ".open-next/cloudflare/init.js", nextEnvPath];

let sanitized = 0;

if (existsSync(nextEnvPath)) {
  const src = readFileSync(nextEnvPath, "utf8");
  const out = src
    .split("\n")
    .map((line) => {
      // Each line is `export const <mode> = { ... };`
      const m = line.match(/^export const (\w+) = (\{.*\});?$/);
      if (!m) return line;
      const [, mode, jsonText] = m;
      let obj;
      try {
        obj = JSON.parse(jsonText);
      } catch {
        return line;
      }
      const before = JSON.stringify(obj);
      for (const key of SECRET_KEYS) delete obj[key];
      // Production must be a real production environment with the real origin.
      if (mode === "production") {
        obj.NODE_ENV = "production";
        obj.APP_URL = "https://ghbc.gabochie.com";
      }
      // Drop local-only values from every mode.
      delete obj.BCGH_CORPUS;
      // A Clerk *development* publishable key must never ship; it is supplied
      // via wrangler vars / the real production instance at runtime.
      if (typeof obj.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" && obj.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
        delete obj.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      }
      if (typeof obj.APP_URL === "string" && /localhost/.test(obj.APP_URL)) delete obj.APP_URL;
      if (mode !== "production" && obj.NODE_ENV === "development") delete obj.NODE_ENV;
      const after = JSON.stringify(obj);
      if (before !== after) sanitized++;
      return `export const ${mode} = ${after};`;
    })
    .join("\n");
  if (out !== src) {
    writeFileSync(nextEnvPath, out);
    console.log(`[check-artifact-secrets] sanitized next-env.mjs (${sanitized} mode object(s))`);
  }
}

let failures = 0;
for (const rel of BUNDLE_TARGETS) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) continue;
  const content = readFileSync(abs, "utf8");
  for (const { needle, label } of FORBIDDEN) {
    if (content.includes(needle)) {
      console.error(`[check-artifact-secrets] FAIL ${rel}: found ${label} ("${needle}")`);
      failures++;
    }
  }
  const nodeEnvHits = content.match(/"NODE_ENV":"development"/g);
  if (nodeEnvHits) {
    console.error(`[check-artifact-secrets] FAIL ${rel}: found ${nodeEnvHits.length}x "NODE_ENV":"development"`);
    failures++;
  }
}

// Preflight the deploy config: unresolved placeholders in wrangler.jsonc vars
// would ship a broken (or missing) Clerk publishable key.
const wranglerPath = resolve(root, "wrangler.jsonc");
if (existsSync(wranglerPath)) {
  const cfg = readFileSync(wranglerPath, "utf8");
  const matches = cfg.match(/REPLACE_WITH_[A-Z_]+/g);
  if (matches) {
    for (const m of matches) {
      console.error(`[check-artifact-secrets] FAIL wrangler.jsonc: unresolved placeholder "${m}"`);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\n[check-artifact-secrets] ${failures} leak(s) detected. Refusing to ship.`);
  process.exit(1);
}

console.log("[check-artifact-secrets] OK — no development secrets in artifact.");
