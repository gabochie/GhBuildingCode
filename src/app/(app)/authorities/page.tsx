import Link from "next/link";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Landmark } from "lucide-react";

export default async function AuthoritiesPage() {
  const db = await getDb();

  const authorities = (await db
    .prepare(
      `SELECT a.*, (SELECT COUNT(*) FROM authority_checklists c WHERE c.authority_id = a.id) AS checklist_count
       FROM authorities a ORDER BY a.authority_type ASC, a.name ASC`
    )
    .all()) as Array<Record<string, unknown>>;

  return (
    <div className="container mx-auto max-w-6xl">
      <PageHeader
        title="Reviewing Authorities"
        description="The agencies involved in building approval, permits and inspections in Ghana."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {authorities.map((a) => (
          <Link key={String(a.id)} href={`/authorities/${a.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  <CardTitle className="leading-snug">{String(a.name)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <Badge tone="primary">{String(a.authority_type)}</Badge>
                  <Badge>{String(a.checklist_count)} checklist items</Badge>
                </div>
                {a.notes ? <p className="line-clamp-2 text-xs">{String(a.notes)}</p> : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
