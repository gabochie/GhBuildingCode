import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, requireAdmin, handleError } from "@/lib/api";
import { saveLead } from "@/lib/voice/lead-capture";

// Optional fields in forms send empty strings (e.g. an unselected topic), so
// allow "" to be treated as "not provided" rather than rejecting it.
const optionalStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const postSchema = z.object({
  name: optionalStr(120),
  email: z.string().trim().min(3).max(255),
  phone: optionalStr(40),
  organization: optionalStr(160),
  source: z.enum(["marketing_form", "voice_browser", "voice_phone", "newsletter", "academy_enrollment"]),
  channel: z.enum(["web", "voice", "phone"]),
  interest: optionalStr(100),
  message: optionalStr(2000),
  voice_session_id: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const parsed = postSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid lead payload.");

    const session = await getSession();
    const { id } = await saveLead({
      ...parsed.data,
      user_id: session?.sub
    });

    return ok({ id, message: "Thank you! Our team will be in touch." });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const source = url.searchParams.get("source");
    const channel = url.searchParams.get("channel");
    const status = url.searchParams.get("status");

    let query = "SELECT * FROM leads";
    const conditions: string[] = [];
    const params: string[] = [];

    if (source) { conditions.push("source = ?"); params.push(source); }
    if (channel) { conditions.push("channel = ?"); params.push(channel); }
    if (status) { conditions.push("status = ?"); params.push(status); }

    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY created_at DESC LIMIT 50";

    const db = await getDb();
    const leads = await db.prepare(query).all(...params);
    return ok({ leads });
  } catch (e) {
    return handleError(e);
  }
}
