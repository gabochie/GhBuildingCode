import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { TrackedButton } from "@/components/tracked-cta";
import { AcademyEnrollmentForm } from "@/components/academy-enrollment-form";
import { GraduationCap, BookOpenCheck, FileCheck2, ShieldAlert, Landmark, ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Ghana Building Code Academy — Source-Backed Training & Certificates",
  description:
    "Study the Ghana Building Code (GS 1207:2018) through structured, source-backed modules and earn a GHBC-issued certificate of completion. Free core track for architects, engineers, fire-safety professionals, developers and building control.",
  openGraph: {
    title: "Ghana Building Code Academy — Source-Backed Training & Certificates",
    description:
      "Structured training for GS 1207:2018 — the Ghana Building Code — built on GHBC's source-backed compliance intelligence. Study free, prove your knowledge, earn a GHBC certificate.",
    type: "website",
    siteName: "GHBC",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Ghana Building Code Academy" }]
  }
};

const AUDIENCES = [
  { icon: Landmark, title: "Architects & designers", body: "Design with the code in mind from the first sketch — requirements, occupancy classes and assembly-specific rules." },
  { icon: BookOpenCheck, title: "Engineers & consultants", body: "Structural, MEP and fire consultants who need clause-level certainty across the 38 parts." },
  { icon: ShieldAlert, title: "Fire-safety professionals", body: "Means-of-egress, separation and fire-safety requirements taught with source citations." },
  { icon: FileCheck2, title: "Developers & building control", body: "Permit readiness, documentation and review workflows that move projects forward faster." }
];

const TRACKS = [
  {
    slug: "gs1207_core",
    icon: GraduationCap,
    title: "GS 1207 Core Proficiency",
    audience: "Foundation — everyone",
    badge: "Free",
    body: "Code structure, scope and the 38-part taxonomy. Learn how the Ghana Building Code is organized and how to navigate it with confidence.",
    highlights: ["Code structure & scope", "Occupancy classes 101", "Navigating the 38-part taxonomy"]
  },
  {
    slug: "compliance_professional",
    icon: BookOpenCheck,
    title: "Building Compliance Professional",
    audience: "Architects · Engineers · Consultants",
    badge: "Professional",
    body: "Requirements analysis, project compliance checks and gap identification using source-backed workflows.",
    highlights: ["Requirement analysis", "Compliance matrices", "Gap identification"]
  },
  {
    slug: "permit_readiness",
    icon: FileCheck2,
    title: "Permit Readiness Certification",
    audience: "Developers · Building control",
    badge: "Professional",
    body: "Authority-specific permit requirements, documentation checklists and submission readiness.",
    highlights: ["Authority checklists", "Documentation", "Submission readiness"]
  },
  {
    slug: "fire_egress",
    icon: ShieldAlert,
    title: "Fire & Means-of-Egress Specialist",
    audience: "Fire-safety professionals",
    badge: "Specialist",
    body: "Fire-safety requirements, means-of-egress and assembly-specific rules — taught clause by clause.",
    highlights: ["Fire requirements", "Means-of-egress", "Assembly-specific rules"]
  }
];

const STEPS = [
  { step: "1", title: "Start learning free", body: "Enroll in the free GS 1207 Core track and work through sourced modules at your own pace." },
  { step: "2", title: "Study the modules", body: "Self-paced lessons, each traceable to the exact clause and page it comes from." },
  { step: "3", title: "Take the assessment", body: "Answer questions drawn only from verified extracts of the Code and see the reasoning." },
  { step: "4", title: "Earn your certificate", body: "Pass the exam and receive a GHBC-issued certificate of completion with a public verification link." }
];

export default function AcademyPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <GraduationCap className="h-4 w-4" />
          Ghana Building Code Academy
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Master the Ghana Building Code. Prove it with a certificate.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Structured training for GS 1207:2018 — built directly on GHBC&apos;s source-backed
          compliance intelligence, with every module traceable to the exact clause and page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TrackedButton href="/learn" event="cta_academy_learn" size="lg">
            Start the free track <ArrowRight className="h-4 w-4" />
          </TrackedButton>
          <TrackedButton href="#tracks" event="cta_academy_tracks" size="lg" variant="outline">
            Explore all tracks
          </TrackedButton>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> 38-part code taxonomy</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Source-backed curriculum</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Publicly verifiable certificate</span>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Built for everyone who works with the code</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Certification tracks mapped to the real workflows of Ghana&apos;s built environment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <Card key={a.title} className="h-full">
                <CardHeader>
                  <a.icon className="mb-2 h-7 w-7 text-primary" />
                  <CardTitle>{a.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="tracks" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Certification tracks</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Pick a track, complete the modules, pass the assessment and earn your GHBC certificate.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {TRACKS.map((t) => (
            <Card key={t.title} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <t.icon className="h-7 w-7 text-primary" />
                  <Badge tone="primary">{t.badge}</Badge>
                </div>
                <CardTitle className="mt-2">{t.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.audience}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-muted-foreground">{t.body}</p>
                <ul className="flex flex-wrap gap-2">
                  {t.highlights.map((h) => (
                    <li key={h}>
                      <Badge>{h}</Badge>
                    </li>
                  ))}
                </ul>
                <TrackedButton href={`/learn/${t.slug}`} event="cta_academy_track_open" props={{ track: t.title }} variant="outline" size="sm" className="mt-auto">
                  {t.slug === "gs1207_core" ? "Start this track" : "View this track"}
                </TrackedButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary">{s.step}</div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="enroll" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Start learning today</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Begin with the free core track online, or tell us which track fits you (or your
              organization) and our academy team will confirm the curriculum, schedule and fees.
              Cohort and organization training available.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><GraduationCap className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold">Free foundation track</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with GS 1207 Core Proficiency — the code-structure track is open to everyone.{" "}
                    <Link href="/learn/gs1207_core" className="font-medium text-primary hover:underline">Begin now →</Link>
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileCheck2 className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold">GHBC-issued certificates</h3>
                  <p className="text-sm text-muted-foreground">
                    Pass a track&apos;s exam to receive a GHBC certificate of completion with a public
                    verification link. These are GHBC-issued and are not an accredited professional
                    licence or a government credential.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <AcademyEnrollmentForm />
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-6xl px-6">
        <div className="rounded-2xl bg-sidebar px-8 py-12 text-center text-sidebar-foreground">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Train your whole team on the code.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Organization cohorts, custom schedules and group training for firms,
            regulators and developers.
          </p>
          <TrackedButton href="#enroll" event="cta_academy_team" size="lg" className="mt-7 bg-white text-slate-900 hover:opacity-90">
            Request a team cohort
          </TrackedButton>
        </div>
      </section>
    </div>
  );
}