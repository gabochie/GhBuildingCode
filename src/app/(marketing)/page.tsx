import Link from "next/link";
import type { Metadata } from "next";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import {
  MessageSquareText,
  ShieldCheck,
  ClipboardCheck,
  BookOpenCheck,
  ArrowRight,
  Landmark,
  Building2,
  ScrollText,
  Workflow
} from "lucide-react";

export const metadata: Metadata = {
  title: "GHBC — Ghana Building Compliance Intelligence",
  description: "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018). Search 27,000+ requirements, check your project, find gaps, build with confidence.",
  openGraph: {
    title: "GHBC — Ghana Building Compliance Intelligence",
    description: "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018). Search 27,000+ requirements, check your project, find gaps, build with confidence.",
    type: "website",
    siteName: "GHBC"
  }
};

const features = [
  {
    icon: MessageSquareText,
    title: "Ask",
    body: "Ask questions about Ghanaian building requirements and get source-backed answers with citations.",
    href: "/copilot"
  },
  {
    icon: ShieldCheck,
    title: "Check",
    body: "Compare project information against applicable requirements and see a compliance matrix.",
    href: "/projects"
  },
  {
    icon: ClipboardCheck,
    title: "Prepare",
    body: "Generate project-specific compliance and permit-readiness checklists for your assembly.",
    href: "/permit"
  },
  {
    icon: BookOpenCheck,
    title: "Verify",
    body: "Trace every answer back to its regulatory source — document, part, section, clause and page.",
    href: "/code"
  }
];

const modules = [
  { icon: Building2, title: "GS 1207:2018 Code Explorer", body: "Browse the 38-part Ghana Building Code taxonomy with full provenance." },
  { icon: Workflow, title: "Project Compliance Profile", body: "Answer a few questions; GHBC constructs your compliance matrix." },
  { icon: Landmark, title: "Ghana Permit Intelligence", body: "Authority-specific permit requirements, checklists and process." },
  { icon: ScrollText, title: "Regulatory Source Library", body: "Structured, versioned, editorial-controlled regulatory knowledge." }
];

export default function LandingPage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Compliance intelligence for Ghana&apos;s AEC industry
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
          Ghana Building Compliance, Made Clear.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          Understand the requirements. Check your project. Find what&apos;s missing.
          Build with greater confidence.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg">Check a Project <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link href="/code">
            <Button size="lg" variant="outline">Explore Ghana Building Code</Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Preliminary compliance intelligence — not a legal determination or permit approval.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link key={f.title} href={f.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <f.icon className="mb-2 h-7 w-7 text-primary" />
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2">
          {modules.map((m) => (
            <div key={m.title} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{m.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl bg-sidebar px-8 py-12 text-center text-sidebar-foreground">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            From fragmented regulations to a structured compliance system.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Searchable, explainable, project-aware digital compliance for architects,
            engineers, developers, fire-safety professionals and building control.
          </p>
          <Link href="/register" className="mt-7 inline-block">
            <Button size="lg" className="bg-white text-slate-900 hover:opacity-90">Start free</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
