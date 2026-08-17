import { searchRequirements, searchChunks, searchDefinitions, type RetrievedRequirement } from "./retrieval";
import { buildCitations, citationText, CITATION_DISCLAIMER, type Citation } from "./citations";
import { chatCompletion, aiConfigured } from "./provider";

export interface RagAnswer {
  content: string;
  citations: Citation[];
  confidence: number;
  safety_flag: "NONE" | "REVIEW_REQUIRED" | "SOURCE_NOT_VERIFIED" | "REGULATORY_CONFLICT_DETECTED";
  used_ai: boolean;
}

export interface RagContext {
  project?: {
    id?: string;
    name?: string;
    occupancy?: string;
    floors?: number;
    building_height?: number;
    floor_area?: number;
    location?: string;
    project_type?: string;
  };
  part?: number;
}

const SYSTEM_PROMPT = `You are GHBC, the Ghana Building Compliance Intelligence copilot.

RULES (mandatory):
1. Answer ONLY from the provided SOURCE EXCERPTS. Never invent section numbers, dimensions, requirements, standards, or authority requirements.
2. If the provided sources do not contain the information, say: "I could not verify this requirement from the available GHBC source library." and do NOT improvise.
3. For each claim, structure your answer using these four parts where relevant:
   - SOURCE REQUIREMENT: what the source actually says.
   - INTERPRETATION: how GHBC interprets it (clearly labelled as interpretation).
   - PROJECT APPLICATION: how it appears to apply to the user's project.
   - PROFESSIONAL REVIEW: what must be verified by a qualified professional or authority.
4. Cite sources inline using the bracket notation provided (e.g. [GS 1207:2018, Part 10, §10.7, p.350]).
5. Distinguish requirement types (mandatory vs recommended vs conditional). Never present a recommendation as a mandatory requirement.
6. When multiple sources are relevant, show all of them.
7. If sources conflict, state REGULATORY CONFLICT DETECTED and show both.
8. Never present AI interpretation as an official legal ruling.`;

function deterministicFallback(
  question: string,
  requirements: RetrievedRequirement[]
): string {
  if (!requirements.length) {
    return "I could not verify this requirement from the available GHBC source library.";
  }
  const parts = requirements
    .slice(0, 6)
    .map(
      (r, i) =>
        `${i + 1}. ${r.source_document}, Part ${r.part}${r.section ? ` §${r.section}` : ""}${r.clause ? `, ${r.clause}` : ""} (${r.requirement_type}): ${r.source_text}`
    )
    .join("\n\n");
  return (
    `Based on the GHBC regulatory source library, the following ${requirements.length > 1 ? "sources are" : "source is"} most relevant to "${question}".\n\n` +
    parts +
    `\n\n${CITATION_DISCLAIMER} Professional verification required. The LLM copilot is unavailable; this is a deterministic retrieval answer.`
  );
}

function scoreConfidence(requirements: RetrievedRequirement[], usedAi: boolean): number {
  if (!requirements.length) return 0;
  const verified = requirements.filter((r) => r.editorial_state === "VERIFIED").length;
  const avgScore = requirements.reduce((a, r) => a + (r.score || 0), 0) / requirements.length;
  let c = 0.4 + verified / requirements.length * 0.4;
  if (!usedAi) c -= 0.15;
  c += Math.min(avgScore / 100, 0.2);
  return Math.max(0.1, Math.min(0.98, c));
}

export async function answerQuestion(question: string, ctx: RagContext = {}): Promise<RagAnswer> {
  const requirements = await searchRequirements({
    query: question,
    part: ctx.part ?? null,
    limit: 8
  });
  const chunks = await searchChunks(question, { part: ctx.part ?? undefined, limit: 5 });
  const defs = await searchDefinitions(question);

  const citations = buildCitations(requirements);
  const usedAi = aiConfigured();
  const confidence = scoreConfidence(requirements, usedAi);

  if (!usedAi || !requirements.length) {
    const content = deterministicFallback(question, requirements);
    return {
      content,
      citations,
      confidence,
      safety_flag: requirements.length ? "REVIEW_REQUIRED" : "SOURCE_NOT_VERIFIED",
      used_ai: false
    };
  }

  const excerpts = [
    ...requirements.slice(0, 8).map(
      (r) =>
        `${citationText({
          requirement_id: r.requirement_id,
          source_document: r.source_document,
          part: r.part,
          section: r.section,
          clause: r.clause,
          page: r.page,
          snippet: "",
          status: "needs_verification"
        })} (${r.requirement_type}, state=${r.editorial_state}): ${r.source_text}`
    ),
    ...chunks.map((c) => `${citationText({ requirement_id: c.chunk_id, source_document: "GS 1207:2018", part: c.part, section: c.section, clause: c.clause, page: c.page, snippet: "", status: "needs_verification" })}: ${c.text.slice(0, 900)}`),
    ...defs.map((d) => `DEFINITION "${d.term}": ${d.definition}`)
  ].join("\n\n---\n\n");

  const projectBlock = ctx.project
    ? `\n\nPROJECT CONTEXT:\n${JSON.stringify(ctx.project, null, 2)}`
    : "";

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `QUESTION: ${question}${projectBlock}\n\nAVAILABLE SOURCES:\n${excerpts}`
    }
  ];

  try {
    const result = await chatCompletion(messages, { temperature: 0.2 });
    return {
      content: result.content,
      citations,
      confidence,
      safety_flag: confidence < 0.5 ? "REVIEW_REQUIRED" : "NONE",
      used_ai: true
    };
  } catch {
    const content = deterministicFallback(question, requirements);
    return {
      content,
      citations,
      confidence: Math.min(confidence, 0.7),
      safety_flag: "REVIEW_REQUIRED",
      used_ai: false
    };
  }
}
