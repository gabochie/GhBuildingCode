import Link from "next/link";
import type { Metadata } from "next";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { TrackedCta } from "@/components/tracked-cta";
import { NewsletterForm } from "@/components/newsletter-form";
import PricingSection from "@/components/pricing-section";
import {
  MessageSquareText,
  ShieldCheck,
  ClipboardCheck,
  BookOpenCheck,
  ArrowRight,
  Landmark,
  Building2,
  ScrollText,
  Workflow,
  GraduationCap,
  Check
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
          <TrackedCta href="/register" event="cta_check_project" className="inline-block">
            <Button size="lg">Check a Project <ArrowRight className="h-4 w-4" /></Button>
          </TrackedCta>
          <TrackedCta href="/demo" event="cta_book_demo" className="inline-block">
            <Button size="lg" variant="outline">Book a free demo</Button>
          </TrackedCta>
          <TrackedCta href="/code" event="cta_explore_code" className="inline-block">
            <Button size="lg" variant="ghost">Explore Ghana Building Code</Button>
          </TrackedCta>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Preliminary compliance intelligence — not a legal determination or permit approval.
        </p>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> 27,000+ requirements searchable</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Source-backed citations</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Free to start</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <TrackedCta key={f.title} href={f.href} event="cta_feature" props={{ feature: f.title }}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <f.icon className="mb-2 h-7 w-7 text-primary" />
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            </TrackedCta>
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

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Simple, local pricing</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Pay in Ghana cedis via mobile money or card. Start free — upgrade when your projects do.
          </p>
        </div>
        <PricingSection />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Need SSO, unlimited usage or a dedicated deployment?{" "}
          <Link href="/demo" className="font-medium text-primary hover:underline">Talk to us about Enterprise →</Link>
        </p>
      </section>

      <section className="bg-card">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <GraduationCap className="h-4 w-4" />
              Certified Ghana Building Code Academy
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Learn the code. Earn certified credentials.</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Structured training and certification for GS 1207:2018, built on GHBC&apos;s source-backed
              compliance intelligence. Tracks for architects, engineers, fire-safety professionals,
              developers and building control.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedCta href="/academy" event="cta_academy_explore" className="inline-block">
                <Button>Explore the Academy <ArrowRight className="h-4 w-4" /></Button>
              </TrackedCta>
              <TrackedCta href="/academy#enroll" event="cta_academy_enroll_home" className="inline-block">
                <Button variant="outline">Request enrollment</Button>
              </TrackedCta>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Certificate of competency", "Free foundation module", "Self-paced + cohorts", "Team training"].map((item) => (
              <div key={item} className="rounded-xl border border-border bg-background p-5">
                <Check className="h-5 w-5 text-success" />
                <p className="mt-3 text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-6xl px-6">
        <div className="rounded-2xl bg-sidebar px-8 py-12 text-center text-sidebar-foreground">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            From fragmented regulations to a structured compliance system.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Searchable, explainable, project-aware digital compliance for architects,
            engineers, developers, fire-safety professionals and building control.
          </p>
          <TrackedCta href="/register" event="cta_start_free" className="mt-7 inline-block">
            <Button size="lg" className="bg-white text-slate-900 hover:opacity-90">Start free</Button>
          </TrackedCta>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
            <div className="max-w-md">
              <h2 className="text-xl font-bold">Ghana building-compliance updates</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                New regulatory guidance, permit changes and practical articles — a few times a month, no spam.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </>
  );
}
