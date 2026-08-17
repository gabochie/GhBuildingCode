import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { CodeSearch } from "@/components/code-search";

export default async function CodeExplorerPage() {
  const session = await getSession();
  const db = await getDb();

  const parts = (await db
    .prepare(
      `SELECT p.*,
        (SELECT COUNT(*) FROM sections s WHERE s.part_id = p.id) AS section_count,
        (SELECT COUNT(*) FROM clauses c JOIN sections s ON c.section_id = s.id WHERE s.part_id = p.id) AS clause_count
       FROM parts p ORDER BY p.part_no ASC`
    )
    .all()) as Array<Record<string, unknown>>;

  return (
    <div>
      <PageHeader
        title="Code Explorer"
        description="Browse the Ghana Building Code (GS 1207:2018). Every requirement shows its part, clause and verification status."
      />
      <CodeSearch />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map((p) => (
          <Link key={String(p.id)} href={`/code/${p.part_no}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge tone="primary">Part {String(p.part_no)}</Badge>
                </div>
                <CardTitle className="mt-2 leading-snug">{String(p.title)}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3 text-xs text-muted-foreground">
                <span>{String(p.section_count)} sections</span>
                <span>{String(p.clause_count)} clauses</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
