import { unauthorized, ok, handleError } from "@/lib/api";
import { runRenewalSweep } from "@/lib/billing/maintenance";

/**
 * Internal cron endpoint, invoked by the Worker's `scheduled` handler over a
 * loopback fetch with a shared secret header (`x-cron-secret`).
 *
 * Guards:
 *  - Must be POST.
 *  - `CRON_SECRET` env var must be set, and the request must present it.
 *  - Rejects non-looped (public) requests.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return unauthorized("Cron is not configured (missing CRON_SECRET).");

  const provided = req.headers.get("x-cron-secret");
  if (!provided || provided !== secret) return unauthorized("Bad cron secret.");

  try {
    const result = await runRenewalSweep({ reminderWindowDays: 7 });
    return ok({
      ok: true,
      ...result,
      at: new Date().toISOString()
    });
  } catch (e) {
    return handleError(e);
  }
}
