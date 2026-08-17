import { z } from "zod";
import { getDb, uid, now } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { answerQuestion } from "@/lib/ai/rag";
import { ok, badRequest, unauthorized, limitReached, handleError } from "@/lib/api";
import { checkLimit, incrementUsage } from "@/lib/billing/plans";

const schema = z.object({
  question: z.string().min(3).max(2000),
  project_id: z.string().optional(),
  conversation_id: z.string().optional(),
  part: z.coerce.number().int().optional()
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest("Invalid question payload.");
    const { question, project_id, conversation_id, part } = parsed.data;

    const db = await getDb();
    const chk = await checkLimit(session.sub, session.plan, "aiQuestionsPerMonth");
    if (!chk.allowed) return limitReached("AI questions", chk.used, chk.limit, session.plan);
    let convId = conversation_id;
    if (!convId) {
      convId = uid("conv");
      await db.prepare("INSERT INTO ai_conversations (id, user_id, project_id, title, created_at) VALUES (?, ?, ?, ?, ?)").run(
        convId, session.sub, project_id ?? null, question.slice(0, 80), now()
      );
    }

    await db.prepare("INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)").run(
      uid("msg"), convId, question, now()
    );

    const projectCtx = project_id
      ? ((await db.prepare("SELECT id, name, occupancy, floors, building_height, floor_area, location_assembly, project_type FROM projects WHERE id = ? AND user_id = ?").get(project_id, session.sub)) as Record<string, unknown> | undefined)
      : undefined;

    const answer = await answerQuestion(question, {
      project: projectCtx
        ? {
            id: String(projectCtx.id),
            name: String(projectCtx.name ?? ""),
            occupancy: projectCtx.occupancy ? String(projectCtx.occupancy) : undefined,
            floors: projectCtx.floors as number,
            building_height: projectCtx.building_height as number,
            floor_area: projectCtx.floor_area as number,
            location: projectCtx.location_assembly ? String(projectCtx.location_assembly) : undefined,
            project_type: projectCtx.project_type ? String(projectCtx.project_type) : undefined
          }
        : undefined,
      part
    });

    const assistantMsgId = uid("msg");
    await db.prepare(
      "INSERT INTO ai_messages (id, conversation_id, role, content, citations_json, confidence, safety_flag, created_at) VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)"
    ).run(assistantMsgId, convId, answer.content, JSON.stringify(answer.citations), answer.confidence, answer.safety_flag, now());

    for (const c of answer.citations) {
      await db.prepare(
        "INSERT INTO source_citations (id, message_id, requirement_id, clause_id, source_document, part, section, clause, page, snippet, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        uid("cite"), assistantMsgId, c.requirement_id, null, c.source_document, c.part, c.section, c.clause, c.page, c.snippet, c.status
      );
    }

    await incrementUsage(session.sub, "ai_questions");

    return ok({
      answer: answer.content,
      citations: answer.citations,
      confidence: answer.confidence,
      safety_flag: answer.safety_flag,
      used_ai: answer.used_ai,
      conversation_id: convId
    });
  } catch (e) {
    return handleError(e);
  }
}
