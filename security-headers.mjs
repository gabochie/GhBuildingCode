// Production security headers. Consumed by:
//  - `worker-scheduled.js` — every dynamic response
//  - `next.config.ts`      — next dev / prerendered responses
//  - `public/_headers`     — static assets served directly by Cloudflare
//    (the static-assets server cannot import this module, so that copy is
//    duplicated by hand — keep it in sync).
//
// CSP notes:
//  - 'unsafe-inline' is required for script-src because Next.js emits inline
//    hydration/bootstrap scripts and the theme-init snippet (see app/layout.tsx).
//  - Clerk's frontend API (daring-shrimp-1960.clerk.accounts.dev) plus the
//    wildcard Clerk domains are allowed for scripts/connect/frames.
//  - Plausible analytics is allowed only for its script + connect endpoint.
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' https://plausible.io https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://plausible.io https://challenges.cloudflare.com",
    "frame-src https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join("; ")
};
