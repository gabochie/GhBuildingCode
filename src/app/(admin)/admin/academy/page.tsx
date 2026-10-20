import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, THead, TR, TH, TD } from "@/components/ui";

export default async function AdminAcademyPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const db = await getDb();
  const stats = {
    certifications: ((await db.prepare("SELECT COUNT(*) c FROM certifications").get()) as { c: number }).c,
    courses: ((await db.prepare("SELECT COUNT(*) c FROM academy_courses").get()) as { c: number }).c,
    lessons: ((await db.prepare("SELECT COUNT(*) c FROM academy_lessons").get()) as { c: number }).c,
    questions: ((await db.prepare("SELECT COUNT(*) c FROM academy_questions").get()) as { c: number }).c,
    examEligible: ((await db.prepare("SELECT COUNT(*) c FROM academy_questions WHERE exam_eligible = 1").get()) as { c: number }).c,
    enrollments: ((await db.prepare("SELECT COUNT(*) c FROM academy_enrollments").get()) as { c: number }).c,
    certificates: ((await db.prepare("SELECT COUNT(*) c FROM academy_certificates WHERE revoked_at IS NULL").get()) as { c: number }).c
  };

  const enrollments = (await db
    .prepare(
      `SELECT e.id, e.status, e.enrolled_at, e.completed_at, u.email, c.title AS cert_title
       FROM academy_enrollments e
       JOIN users u ON u.id = e.user_id
       JOIN certifications c ON c.id = e.certification_id
       ORDER BY e.enrolled_at DESC LIMIT 25`
    )
    .all()) as Array<Record<string, unknown>>;

  const certs = (await db
    .prepare(
      `SELECT cert.serial, cert.recipient_name, cert.issued_at, cert.revoked_at, c.title AS cert_title
       FROM academy_certificates cert
       JOIN certifications c ON c.id = cert.certification_id
       ORDER BY cert.issued_at DESC LIMIT 25`
    )
    .all()) as Array<Record<string, unknown>>;

  return (
    <div>
      <PageHeader
        title="Academy"
        description="Certifications, courses, question bank and learner progress."
        actions={<Badge tone="primary">Admin</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Certifications", stats.certifications],
          ["Courses", stats.courses],
          ["Lessons", stats.lessons],
          ["Questions", stats.questions],
          ["Exam-eligible questions", stats.examEligible],
          ["Enrollments", stats.enrollments],
          ["Active certificates", stats.certificates]
        ].map(([k, v]) => (
          <Card key={String(k)}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold">{String(v)}</p>
              <p className="text-xs text-muted-foreground">{String(k)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent enrollments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Enrolled</TH><TH>Email</TH><TH>Certification</TH><TH>Status</TH><TH>Completed</TH></TR>
            </THead>
            <tbody>
              {enrollments.length === 0 ? (
                <TR><TD className="text-xs text-muted-foreground" colSpan={5}>No enrollments yet.</TD></TR>
              ) : enrollments.map((e) => (
                <TR key={String(e.id)}>
                  <TD className="text-xs text-muted-foreground">{String(e.enrolled_at)}</TD>
                  <TD className="text-xs">{String(e.email)}</TD>
                  <TD className="text-sm">{String(e.cert_title)}</TD>
                  <TD><Badge tone={String(e.status) === "completed" ? "success" : "default"}>{String(e.status)}</Badge></TD>
                  <TD className="text-xs text-muted-foreground">{e.completed_at ? String(e.completed_at) : "—"}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Issued certificates</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR><TH>Issued</TH><TH>Recipient</TH><TH>Certification</TH><TH>Serial</TH><TH>Status</TH></TR>
            </THead>
            <tbody>
              {certs.length === 0 ? (
                <TR><TD className="text-xs text-muted-foreground" colSpan={5}>No certificates issued yet.</TD></TR>
              ) : certs.map((c) => (
                <TR key={String(c.serial)}>
                  <TD className="text-xs text-muted-foreground">{String(c.issued_at)}</TD>
                  <TD className="text-sm">{String(c.recipient_name)}</TD>
                  <TD className="text-sm">{String(c.cert_title)}</TD>
                  <TD className="font-mono text-xs">{String(c.serial)}</TD>
                  <TD><Badge tone={c.revoked_at ? "destructive" : "success"}>{c.revoked_at ? "revoked" : "valid"}</Badge></TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
