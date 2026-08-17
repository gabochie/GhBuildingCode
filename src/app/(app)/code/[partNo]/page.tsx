import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui";

export default async function PartDetailPage({ params }: { params: Promise<{ partNo: string }> }) {
  const { partNo } = await params;
  const session = await getSession();
  const db = await getDb();

  const part = (await db.prepare("SELECT * FROM parts WHERE part_no = ?").get(partNo)) as Record<string, unknown> | undefined;
  if (!part) notFound();

  const sections = (await db.prepare("SELECT * FROM sections WHERE part_id = ? ORDER BY section_no ASC").all(part.id)) as Array<Record<string, unknown>>;
  const clauses = (await db
    .prepare(
      `SELECT c.*, s.section_no FROM clauses c JOIN sections s ON c.section_id = s.id
       WHERE s.part_id = ? ORDER BY s.section_no ASC, c.clause_no ASC`
    )
    .all(part.id)) as Array<Record<string, unknown>>;

  const bySection = new Map<string | null, Array<Record<string, unknown>>>();
  for (const c of clauses) {
    const key = c.section_id ? String(c.section_id) : null;
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push(c);
  }

  return (
    <div>
      <PageHeader
        title={`Part ${partNo} — ${String(part.title)}`}
        description={String(part.description ?? "Ghana Building Code (GS 1207:2018).")}
        actions={
          <Link href="/code">
            <Badge tone="primary" className="hover:bg-primary/20">← All parts</Badge>
          </Link>
        }
      />

      <div className="space-y-5">
        {sections.map((s) => {
          const sc = clauses.filter((c) => c.section_id === s.id);
          return (
            <section key={String(s.id)} className="rounded-xl border border-border bg-card">
              <h2 className="border-b border-border p-4 font-semibold">
                {String(s.section_no) && <span className="text-primary">{String(s.section_no)}.</span>} {String(s.title)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{sc.length} clauses</span>
              </h2>
              <ul className="divide-y divide-border">
                {sc.map((c) => (
                  <li key={String(c.id)} id={String(c.clause_no)} className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{String(c.clause_no)}</span>
                      <Badge tone={c.verification_status === "VERIFIED" ? "success" : "warning"}>
                        {String(c.verification_status ?? "requires_review")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{String(c.source_text)}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
