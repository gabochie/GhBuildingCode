import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { runComplianceCheck } from "@/lib/compliance/check";
import { ok, notFound, unauthorized, forbidden, limitReached, handleError } from "@/lib/api";
import { consumeQuota } from "@/lib/billing/plans";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = await getDb();
    const project = (await db.prepare("SELECT * FROM projects WHERE id = ?").get(id)) as Record<string, unknown> | undefined;
    if (!project) return notFound("Project not found");
    if (project.user_id !== session.sub) return forbidden();

    const chk = await consumeQuota(session.sub, session.plan, "complianceChecksPerMonth");
    if (!chk.allowed) return limitReached("compliance checks", chk.used, chk.limit, session.plan);

    const result = await runComplianceCheck(project);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
