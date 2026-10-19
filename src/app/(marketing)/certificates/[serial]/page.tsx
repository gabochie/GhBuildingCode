import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { Award, ShieldCheck, ShieldX, ExternalLink } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ serial: string }> }): Promise<Metadata> {
  const { serial } = await params;
  return {
    title: `Certificate ${serial}`,
    description: "Verify a GHBC Academy certificate against the GS 1207:2018 record.",
    robots: { index: false, follow: false }
  };
}

export default async function CertificatePage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params;
  const db = await getDb();
  const row = (await db
    .prepare(
      `SELECT c.serial, c.recipient_name, c.issued_at, c.expires_at, c.revoked_at, c.revoke_reason,
              c.verify_hash, cert.title, cert.level, cert.slug
         FROM academy_certificates c
         JOIN certifications cert ON cert.id = c.certification_id
        WHERE c.serial = ?`
    )
    .get(serial)) as Record<string, unknown> | undefined;
  if (!row) notFound();

  const valid = !row.revoked_at;
  const issued = new Date(String(row.issued_at));

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            {valid ? <ShieldCheck className="h-12 w-12 text-success" /> : <ShieldX className="h-12 w-12 text-destructive" />}
            <h1 className="text-2xl font-extrabold tracking-tight">
              {valid ? "Certificate verified" : "Certificate revoked"}
            </h1>
            <p className="text-sm text-muted-foreground">GHBC Academy · Ghana Building Code (GS 1207:2018)</p>
          </div>

          <dl className="mt-8 divide-y divide-border text-sm">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Holder</dt>
              <dd className="font-medium">{String(row.recipient_name)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Certification</dt>
              <dd className="text-right font-medium">{String(row.title)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Level</dt>
              <dd className="font-medium capitalize">{String(row.level)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Serial</dt>
              <dd className="font-mono text-xs">{String(row.serial)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-muted-foreground">Issued</dt>
              <dd className="font-medium">
                {issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </dd>
            </div>
            {Boolean(row.revoked_at) && (
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-muted-foreground">Revoked</dt>
                <dd className="text-right font-medium text-destructive">
                  {new Date(String(row.revoked_at)).toLocaleDateString("en-GB")}
                  {row.revoke_reason ? ` — ${String(row.revoke_reason)}` : ""}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Award className="h-3.5 w-3.5 shrink-0" />
            <span className="break-all">Verification hash: {String(row.verify_hash).slice(0, 32)}…</span>
          </div>
        </CardContent>
      </Card>

      <a
        href="https://ghbc.gabochie.com/learn"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        About the GHBC Academy <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </main>
  );
}
