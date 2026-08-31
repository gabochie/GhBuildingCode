import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ok, badRequest, requireAdmin, handleError } from "@/lib/api";
import { saveLead } from "@/lib/voice/lead-capture";const postSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().min(3).max(255),
  phone: z.string().min(1).max(40).optional(),
  organization: z.string().min(1).max(160).optional(),
  source: z.enum(["marketing_form", "voice_browser", "voice_phone", "newsletter"]),
  channel: z.enum(["web", "voice", "phone"]),
  interest: z.string().min(1).max(100).optional(),
  message: z.string().max(2000).optional(),
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
