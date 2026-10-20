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
//  - Clerk's frontend API: the production instance is served from the custom
//    domain (clerk.gabochie.com / accounts.gabochie.com), and the development
//    instance from *.clerk.accounts.dev. The *.clerk.com wildcard covers Clerk's
//    hosted assets. All three must be allowed or Clerk's JS is blocked and the
//    sign-in/sign-up widgets silently fail to mount.
//  - Clerk's bot-protection ("Clerk Protect") runs a probe against
//    *.client.protect.clerk.com on non-standard ports (443, 8443, 18443,
//    2082, 992, ...). CSP host wildcards match only the default port, so an
//    explicit ":*" port wildcard is required — otherwise the probe is blocked
//    and sign-up submissions stall ("Verifying your request") and reset.
//  - Plausible analytics is allowed only for its script + connect endpoint.
export const CLERK_ORIGINS = [
  "https://clerk.gabochie.com",
  "https://accounts.gabochie.com",
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com"
];

// Hosts Clerk connects to (XHR/fetch/beacon) but that are not script/frame
// origins — kept separate so connect-src can be broader than script-src.
// The ":*" port wildcard covers Clerk Protect's non-standard probe ports.
export const CLERK_CONNECT_ORIGINS = [
  ...CLERK_ORIGINS,
  "https://*.client.protect.clerk.com",
  "https://*.client.protect.clerk.com:*"
];

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
    `script-src 'self' 'unsafe-inline' https://plausible.io ${CLERK_ORIGINS.join(" ")} https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${CLERK_CONNECT_ORIGINS.join(" ")} https://plausible.io https://challenges.cloudflare.com`,
    `frame-src ${CLERK_ORIGINS.join(" ")} https://challenges.cloudflare.com`,
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join("; ")
};
