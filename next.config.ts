import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./security-headers.mjs";

// Single source of truth for security headers: this file (next dev / prerender),
// `worker-scheduled.js` (every dynamic response) and `public/_headers` (static
// assets) all derive from `security-headers.mjs`.
const securityHeaders = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value }));

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb"
    }
  }
};

export default nextConfig;
