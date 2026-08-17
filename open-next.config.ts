import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Exclude native modules that can't run on Cloudflare Workers
  // @ts-expect-error - external is supported but not typed
  external: ["better-sqlite3", "pdf-parse"],
});
