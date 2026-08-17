export interface ReviewFinding {
  issue: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATION";
  confidence: number;
  source: string;
  reason: string;
  recommended_action: string;
}

/**
 * Document extraction (§13/§14 MVP).
 * - PDF text extraction via pdf-parse (text layer). Scanned/image-only PDFs
 *   produce no text; we report that honestly instead of fabricating content.
 * - Preliminary review is a deterministic keyword scan that flags which
 *   building features appear present. It NEVER fabricates measurements.
 */

export async function extractText(buffer: Buffer, mime: string, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mime === "application/pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      return result?.text ?? "";
    } catch (e) {
      throw new Error(
        "PDF text extraction failed. The file may be scanned/image-only (OCR is not yet enabled in the MVP)."
      );
    }
  }
  if (lower.endsWith(".json")) {
    try {
      return JSON.stringify(JSON.parse(buffer.toString("utf8")), null, 2);
    } catch {
      return buffer.toString("utf8");
    }
  }
  return buffer.toString("utf8").replace(/\u0000/g, "");
}

const FEATURE_PATTERNS: Array<{ label: string; severity: ReviewFinding["severity"]; pattern: RegExp; action: string }> = [
  { label: "occupancy/room types", severity: "INFORMATION", pattern: /\b(bedroom|kitchen|living|bathroom|toilet|wc\b|office|classroom|assembly|auditorium|ward|restaurant|shop|store)\b/gi, action: "Confirm occupancy classification against Part 3 of GS 1207:2018." },
  { label: "stairs", severity: "MEDIUM", pattern: /\b(stair|stairs|stairway|riser|tread|landing)\b/gi, action: "Verify stair geometry (riser 102–178 mm, tread ≥279 mm, width ≥1219 mm unless sprinklered) against Part 11." },
  { label: "means of escape / exits", severity: "HIGH", pattern: /\b(exit|exits|egress|escape route|fire exit|doorway)\b/gi, action: "Verify exit count, travel distance and common-path thresholds against Part 11 §11.6.2.1." },
  { label: "fire protection", severity: "HIGH", pattern: /\b(fire|sprinkler|extinguisher|fire alarm|smoke detector|fire-rated|compartment)\b/gi, action: "Verify fire-protection and life-safety requirements against Parts 8–10 and the Ghana National Fire Service." },
  { label: "accessibility", severity: "MEDIUM", pattern: /\b(accessible|accessibility|wheelchair|ramp|handrail|disabled)\b/gi, action: "Verify accessibility provisions against Part 12 (Accessibility)." },
  { label: "sanitary facilities", severity: "MEDIUM", pattern: /\b(washroom|restroom|toilet|sanitary|water closet|urinal)\b/gi, action: "Verify sanitary facility counts against Part 30 (Plumbing)." },
  { label: "parking", severity: "LOW", pattern: /\b(parking|car park|parking space|garage)\b/gi, action: "Verify parking provision against Part 5 (Site Development) and local assembly requirements." },
  { label: "structural", severity: "MEDIUM", pattern: /\b(foundation|column|beam|slab|reinforcement|structural|shear wall|footing)\b/gi, action: "Verify structural design against Parts 17–24 and engage a registered structural engineer." },
  { label: "dimensions", severity: "INFORMATION", pattern: /\b(\d+(\.\d+)?\s?(m2|m²|sqm|mm|metres?|meters?))\b/gi, action: "Extracted dimensions are indicators only; do not rely on them for compliance without the original drawings." }
];

export function preliminaryReview(text: string): { features: ReviewFinding[]; text_length: number } {
  const features: ReviewFinding[] = [];
  for (const p of FEATURE_PATTERNS) {
    const matches = text.match(p.pattern);
    if (matches && matches.length) {
      features.push({
        issue: `Document appears to reference ${p.label} (${new Set(matches.map((m) => m.toLowerCase())).size} distinct terms).`,
        severity: p.severity,
        confidence: Math.min(0.85, 0.4 + matches.length * 0.05),
        source: "GHBC document extraction",
        reason: `Deterministic keyword scan found: ${Array.from(new Set(matches.slice(0, 8).map((m) => m.toLowerCase()))).join(", ")}.`,
        recommended_action: p.action
      });
    }
  }
  return { features, text_length: text.length };
}
