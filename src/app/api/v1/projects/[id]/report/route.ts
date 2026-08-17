import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { generateCompliancePdf } from "@/lib/reports/pdf";
import { notFound, unauthorized, forbidden, limitReached, handleError } from "@/lib/api";
import { checkLimit, incrementUsage } from "@/lib/billing/plans";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const { id } = await params;
    const db = getDb();
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!project) return notFound("Project not found");
    if (project.user_id !== session.sub) return forbidden();

    const chk = checkLimit(session.sub, session.plan, "reportsPerMonth");
    if (!chk.allowed) return limitReached("PDF reports", chk.used, chk.limit, session.plan);

    const pdf = await generateCompliancePdf(id, session.sub);
    incrementUsage(session.sub, "reports");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ghbc-compliance-review-${id}.pdf"`
      }
    });
  } catch (e) {
    return handleError(e);
  }
}
