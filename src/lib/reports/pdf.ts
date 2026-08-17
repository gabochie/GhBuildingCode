import { getDb } from "@/lib/db";
import { runComplianceCheck, type ComplianceResult } from "@/lib/compliance/check";
import { statusLabel } from "@/lib/rules/engine";

/**
 * Dependency-free PDF writer. Generates a multi-page
 * "GHBC PROJECT COMPLIANCE REVIEW" report (§26) with the mandatory
 * professional-review disclaimer.
 */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text: string, max = 100): string[] {
  const lines: string[] = [];
  for (const raw of String(text).split("\n")) {
    let line = raw;
    while (line.length > max) {
      let cut = line.lastIndexOf(" ", max);
      if (cut < 1) cut = max;
      lines.push(line.slice(0, cut));
      line = line.slice(cut + 1);
    }
    lines.push(line);
  }
  return lines;
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const BOTTOM = 48;

class PdfBuilder {
  private pages: string[][] = [[]];
  private y = PAGE_H - 50;

  private ensureSpace(needed = 20) {
    if (this.y - needed < BOTTOM) {
      this.pages.push([]);
      this.y = PAGE_H - 50;
      this.emit("0.95 0.96 0.98 rg 0 0 " + PAGE_W + " " + PAGE_H + " re f");
    }
  }

  emit(op: string) {
    this.pages[this.pages.length - 1].push(op);
  }

  fill() {
    this.emit(`0.95 0.96 0.98 rg 0 0 ${PAGE_W} ${PAGE_H} re f`);
  }

  text(s: string, font = "F1", size = 10, indent = MARGIN) {
    this.ensureSpace(14);
    this.emit(`BT /${font} ${size} Tf ${indent} ${this.y} Td (${esc(s)}) Tj ET`);
    this.y -= 15;
  }

  heading(s: string) {
    this.ensureSpace(30);
    this.y -= 10;
    this.emit("0.85 0.87 0.9 RG");
    this.emit(`0.85 0.87 0.9 rg ${MARGIN} ${this.y + 6} ${PAGE_W - MARGIN * 2} 1 re f`);
    this.emit(`BT /F2 13 Tf ${MARGIN} ${this.y} Td (${esc(s)}) Tj ET`);
    this.y -= 22;
  }

  para(text: string, font = "F1", size = 9) {
    for (const ln of wrapText(text)) {
      this.ensureSpace(12);
      this.emit(`BT /${font} ${size} Tf ${MARGIN} ${this.y} Td (${esc(ln)}) Tj ET`);
      this.y -= 13;
    }
    this.y -= 2;
  }

  bullet(prefix: string, text: string) {
    for (const ln of wrapText(text, 96)) {
      this.ensureSpace(12);
      const label = ln === text ? prefix : "  ";
      this.emit(`BT /F1 9 Tf ${MARGIN} ${this.y} Td (${esc(label + ln)}) Tj ET`);
      this.y -= 13;
    }
    this.y -= 1;
  }

  gap(n = 6) {
    this.y -= n;
  }

  render(): Buffer {
    const objParts: string[] = [];
    let objNum = 1;
    const fontF1 = objNum++;
    const fontF2 = objNum++;
    const pageIds: number[] = [];
    for (let i = 0; i < this.pages.length; i++) {
      pageIds.push(objNum++);
      objNum++; // contents
    }
    const catalog = objNum++;
    const pagesRoot = objNum++;

    objParts.push(`${fontF1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);
    objParts.push(`${fontF2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`);

    let contentsIdx = fontF2 + 1; // first contents object number
    for (let i = 0; i < this.pages.length; i++) {
      const stream = this.pages[i].join("\n");
      objParts.push(`${pageIds[i]} 0 obj\n<< /Type /Page /Parent ${pagesRoot} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R >> >> /Contents ${contentsIdx + i} 0 R >>\nendobj`);
      objParts.push(`${contentsIdx + i} 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj`);
    }

    objParts.push(`${catalog} 0 obj\n<< /Type /Catalog /Pages ${pagesRoot} 0 R >>\nendobj`);
    objParts.push(
      `${pagesRoot} 0 obj\n<< /Type /Pages /Kids [${pageIds.map((p) => p + " 0 R").join(" ")}] /Count ${this.pages.length} >>\nendobj`
    );

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    for (const obj of objParts) {
      offsets.push(Buffer.byteLength(pdf));
      pdf += obj + "\n";
    }
    const xrefStart = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objNum}\n0000000000 65535 f \n`;
    for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objNum} /Root ${catalog} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(pdf, "utf8");
  }
}

export async function generateCompliancePdf(projectId: string, userId: string): Promise<Buffer> {
  const db = getDb();
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?")
    .get(projectId, userId) as Record<string, unknown> | undefined;
  if (!project) throw new Error("NOT_FOUND");

  const result = await runComplianceCheck(project);

  const b = new PdfBuilder();
  b.fill();
  b.text("GHBC PROJECT COMPLIANCE REVIEW", "F2", 18);
  b.text("GHBC - Ghana Building Compliance Intelligence", "F1", 10);
  b.text("Generated: " + new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC", "F1", 9);
  b.gap(10);

  b.heading("1. PROJECT INFORMATION");
  const info: Array<[string, unknown]> = [
    ["Project name", project.name],
    ["Location", `${project.location_assembly ?? ""}${project.location_region ? `, ${project.location_region}` : ""}`],
    ["Project type", project.project_type],
    ["Occupancy", project.occupancy],
    ["Storeys", project.floors],
    ["Building height (m)", project.building_height],
    ["Floor area (m2)", project.floor_area],
    ["Site area (m2)", project.site_area],
    ["Occupants", project.occupants],
    ["Structural system", project.structural_system],
    ["GHBC Readiness Score", `${result.readiness_score}%`]
  ];
  for (const [k, v] of info) b.para(`${k}: ${v ?? "Not provided"}`);

  b.heading("2. REGULATORY SOURCES");
  b.para("GS 1207:2018 - Ghana Building Code (Ghana Standards Authority). Controlled regulatory source; presented as extracted, attributed summaries and rules with full clause provenance.");

  b.heading("3. ASSUMPTIONS");
  b.para("Project characteristics as provided by the user. Numerical thresholds are applied deterministically where the extracted clause is marked source-verified; otherwise findings are NOT VERIFIED / REVIEW.");

  b.heading("4. COMPLIANCE MATRIX");
  if (!result.matrix.length) b.para("No applicable requirements identified from the available source library.");
  for (const row of result.matrix.slice(0, 30)) {
    b.bullet("• ", `${row.source} | ${row.requirement_type} | ${statusLabel(row.status)} | ${row.responsible_professional}`);
    for (const ln of wrapText(row.source_text, 90)) b.para(ln, "F1", 8);
    b.gap(2);
  }

  b.heading("5. FINDINGS");
  if (!result.findings.length) b.para("No findings generated. Missing information may still apply.");
  for (const f of result.findings) {
    b.bullet("• ", `[${f.severity}/${statusLabel(f.status)}] ${f.issue}`);
    b.para(`Reason: ${f.reason}`);
    b.para(`Source: ${f.source_reference}${f.source_verified ? " (verified)" : " (needs verification)"}`);
  }

  b.heading("6. MISSING INFORMATION");
  b.para(result.missing_information.length ? result.missing_information.join(", ") : "None identified.");
  b.para("Never call anything PASS merely because the AI assumes it is compliant.");

  b.heading("7. RECOMMENDATIONS");
  b.para("1. Engage the responsible professionals identified in the matrix to verify each finding.");
  b.para("2. Confirm numerical values against the original controlled source before submission.");
  b.para("3. Contact the reviewing authority (assembly / GNFS) for its published checklist and fees.");
  b.para("4. Generate a project-specific permit-readiness checklist from the Permit Readiness workspace.");

  b.heading("8. PROFESSIONAL REVIEW WARNING");
  b.para("This report is an AI-assisted preliminary compliance review and does not constitute approval, certification, professional sign-off, or a determination by a Ghanaian regulatory authority. GHBC interpretation - not an official determination by the issuing authority. Professional verification required.");

  return b.render();
}
