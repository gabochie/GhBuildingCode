import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";

export default async function AuthorityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();

  const authority = (await db.prepare("SELECT * FROM authorities WHERE id = ?").get(id)) as Record<string, unknown> | undefined;
  if (!authority) notFound();

  const checklist = (await db.prepare("SELECT * FROM authority_checklists WHERE authority_id = ? ORDER BY category, item ASC").all(id)) as Array<Record<string, unknown>>;

  const byCategory = new Map<string, Array<Record<string, unknown>>>();
  for (const item of checklist) {
    const cat = String(item.category ?? "General");
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        title={String(authority.name)}
        description={String(authority.notes ?? "")}
        actions={
          <Link href="/authorities">
            <Badge tone="primary" className="hover:bg-primary/20">← All authorities</Badge>
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="primary">{String(authority.authority_type)}</Badge>
        {authority.website ? <a href={String(authority.website)} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">{String(authority.website)}</a> : null}
      </div>

      {byCategory.size === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No checklist items recorded for this authority yet.</CardContent></Card>
      ) : (
        [...byCategory.entries()].map(([cat, items]) => (
          <Card key={cat} className="mb-5">
            <CardHeader><CardTitle>{cat}</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {items.map((it) => (
                  <li key={String(it.id)} className="py-2.5">
                    <p className="text-sm">{String(it.item)}</p>
                    {it.notes ? <p className="mt-0.5 text-xs text-muted-foreground">{String(it.notes)}</p> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
