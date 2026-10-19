// Custom Worker entrypoint that wraps the OpenNext-generated worker.
//
// `.open-next/worker.js` only exports a `fetch` handler. Cloudflare Cron
// Triggers deliver `scheduled` events, which the generated worker would
// silently discard. This wrapper:
//   - forwards `fetch` verbatim to the OpenNext handler, and
//   - adds a `scheduled` handler that fans out to the Next.js cron route over a
//     loopback fetch (entering the Next request scope, where D1/billing run),
//     authenticated with the shared `CRON_SECRET`.
//
// The scheduled handler is deliberately thin: the expire/renewal sweep lives in
// the Next route (`/api/v1/cron/billing`) so it can use the app's DB layer and
// audit logging exactly like any other request.
// @ts-nocheck
/* eslint-disable no-console, import/no-anonymous-default-export */
import openNextWorker from "./.open-next/worker.js";
import { SECURITY_HEADERS } from "./security-headers.mjs";

// `wrangler.jsonc` re-points `main` here; keep OpenNext's exported classes so the
// Durable Object queue / tag-cache / bucket-purge bindings keep resolving.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

const CRON_PATHS = {
  billing: "/api/v1/cron/billing",
};

function isLocalish(url) {
  return (
    !url ||
    url.startsWith("http://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith("http://0.0.0.0")
  );
}

/**
 * Run the daily billing maintenance sweep. No-op (with a log) when the shared
 * secret is missing, so a bare `wrangler dev` shell never hits production.
 */
async function runBillingSweep(env, ctx) {
  const appUrl = env.APP_URL || env.NEXT_PUBLIC_APP_URL || "";
  const secret = env.CRON_SECRET;

  if (!appUrl || isLocalish(appUrl)) {
    console.warn("[cron] APP_URL not set to production; skipping billing sweep");
    return;
  }
  if (!secret) {
    console.warn("[cron] CRON_SECRET not set; skipping billing sweep");
    return;
  }

  ctx.waitUntil(
    fetch(`${appUrl}${CRON_PATHS.billing}`, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    })
      .then(async (res) => {
        const body = await res.text();
        console.log(`[cron] billing sweep -> ${res.status} ${body.slice(0, 400)}`);
      })
      .catch((err) => {
        console.error("[cron] billing sweep failed", err);
      })
  );
}

/**
 * Attach security headers to a Worker response without disturbing the body
 * stream. Responses that already set a header win (an explicit per-route
 * override is preserved). WebSocket upgrades (101) are passed through
 * untouched because a 101 response cannot be reconstructed.
 */
function withSecurityHeaders(res) {
  if (!(res instanceof Response)) return res;
  if (res.status === 101 || res.webSocket) return res;
  if (res.headers.get("Upgrade")?.toLowerCase() === "websocket") return res;
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

async function handleFetch(request, env, ctx) {
  return withSecurityHeaders(await openNextWorker.fetch(request, env, ctx));
}

export default {
  fetch: handleFetch,
  async scheduled(controller, env, ctx) {
    const cron = controller?.cron || "*";
    console.log(`[cron] triggered ${cron}`);
    await runBillingSweep(env, ctx);
  },
};
