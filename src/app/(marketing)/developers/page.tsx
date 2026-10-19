import type { Metadata } from "next";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { TrackedButton, TrackedCta } from "@/components/tracked-cta";
import { SITE_CONTACT } from "@/config/site-contact";
import {
  Braces,
  Terminal,
  KeyRound,
  ShieldCheck,
  Zap,
  Bot,
  ArrowRight,
  Check,
  FileJson,
  Lock
} from "lucide-react";

export const metadata: Metadata = {
  title: "Developer API — Ghana Building Code",
  description:
    "A software-agnostic REST API for the Ghana Building Code (GS 1207:2018). Search requirements, run compliance checks and power AI agents — every response backed by document, part, section and clause citations.",
  openGraph: {
    title: "GHBC Developer API — Ghana Building Code",
    description:
      "Query 27,000+ GS 1207:2018 requirements, run compliance checks and connect AI agents — each result traceable to its regulatory source.",
    type: "website",
    siteName: "GHBC",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "GHBC Developer API" }]
  }
};

const AUTH_MODES = [
  {
    icon: Lock,
    title: "Web session",
    badge: "Signed-in apps",
    body: "Your dashboard and website calls authenticate with the Clerk session cookie. No key needed — the same endpoints power the GHBC UI."
  },
  {
    icon: KeyRound,
    title: "API key",
    badge: "Servers & agents",
    body: "For scripts, back-office systems and AI agents, generate a Bearer key in the app. Keys are scoped, revocable and usage is logged."
  }
];

const ENDPOINT_GROUPS: Array<{ title: string; auth: string; endpoints: Array<[string, string]> }> = [
  {
    title: "Reference & search",
    auth: "Public",
    endpoints: [
      ["GET /api/v1/requirements", "List or filter requirements by occupancy, part, type or query."],
      ["GET /api/v1/requirements/{id}", "A single requirement with its full source citation."],
      ["GET /api/v1/search?q=…", "Keyword search across requirements, chunks and definitions."],
      ["GET /api/v1/parts · /parts/{partNo}", "Browse the code by its 38-part taxonomy."],
      ["GET /api/v1/regulations", "List the regulation documents behind the code."],
      ["GET /api/v1/occupancies · /definitions", "Occupancy groups and defined terms."]
    ]
  },
  {
    title: "Authorities & checklists",
    auth: "Public",
    endpoints: [
      ["GET /api/v1/authorities", "Reviewing authorities and their requirements."],
      ["GET /api/v1/authorities/{id}", "A single authority with its permit checklist."]
    ]
  },
  {
    title: "AI & compliance",
    auth: "Session or key",
    endpoints: [
      ["POST /api/v1/ai/ask", "Ask the code — source-backed answers with citations."],
      ["POST /api/v1/chat", "Streaming chat (SSE) with project context."],
      ["POST /api/v1/compliance/check", "Run a compliance check over a project input."]
    ]
  },
  {
    title: "Agent API",
    auth: "Bearer key",
    endpoints: [
      ["POST /api/v1/agent/compliance-check", "Machine-readable check → applicable requirements, issues, missing information and sources."],
      ["GET /api/v1/agent/capabilities", "Discover the capability list an agent can call."]
    ]
  }
];

const CURL_EXAMPLE = `curl "https://ghbc.gabochie.com/api/v1/search?q=minimum+stair+width&part=10" \\
  -H "Authorization: Bearer ghbc_live_…"`;

const ENVELOPE_EXAMPLE = `{
  "request_id": "8f3c1a2b-…",
  "timestamp": "2026-01-01T12:00:00.000Z",
  "status": "ok",
  "data": {},
  "warnings": [],
  "sources": []
}`;

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

export default function DevelopersPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <Braces className="h-4 w-4" />
          Developer API
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Build on the Ghana Building Code.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          A software-agnostic REST API over GS 1207:2018. Search 27,000+ requirements, run
          compliance checks and connect AI agents — every response carries the same
          source-backed guarantees as the GHBC product.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <TrackedButton href="/register" event="cta_dev_get_key" size="lg">
            Create an account to get a key <ArrowRight className="h-4 w-4" />
          </TrackedButton>
          <TrackedButton href="#endpoints" event="cta_dev_reference" size="lg" variant="outline">
            Browse the endpoint reference
          </TrackedButton>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Citation on every result</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Scoped, revocable keys</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> Same-origin under <code className="text-primary">/api/v1</code></span>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Two ways to authenticate</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              Use the session for first-party apps; use a scoped key everywhere else.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {AUTH_MODES.map((m) => (
              <Card key={m.title} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <m.icon className="h-7 w-7 text-primary" />
                    <Badge tone="primary">{m.badge}</Badge>
                  </div>
                  <CardTitle className="mt-2">{m.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Terminal className="h-3.5 w-3.5" /> Quickstart
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Three lines to your first result.</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Reference endpoints are public — no key required. Add a Bearer key for the AI,
              compliance and agent endpoints. Every payload is returned in a consistent envelope.
            </p>
            <div className="mt-6 space-y-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Check className="h-4 w-4 text-success" /> Public reference call
              </p>
              <Code>{CURL_EXAMPLE}</Code>
              <p className="flex items-center gap-2 text-sm font-medium">
                <FileJson className="h-4 w-4 text-primary" /> Response envelope
              </p>
              <Code>{ENVELOPE_EXAMPLE}</Code>
            </div>
          </div>
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Source-backed by default
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Results carry the same provenance as the product: document, part, section,
                  clause and page. Nothing is invented — if the code does not cover a point, the
                  API says so rather than guessing.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Rate limits & errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sensitive and expensive endpoints are rate-limited. When you hit a limit the API
                  returns <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">429</code> with the
                  envelope error code <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">RATE_LIMITED</code> and{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">Retry-After</code>,{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">X-RateLimit-Limit</code> and{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">X-RateLimit-Remaining</code> headers.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" /> Agent-ready
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Agents authenticate with a Bearer key and discover capabilities at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-primary">/api/v1/agent/capabilities</code>{" "}
                  — classification, fire, accessibility, means-of-escape, site, documentation and
                  permit-readiness checks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="endpoints" className="border-y border-border bg-card scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Braces className="h-3.5 w-3.5" /> v1 · base URL /api/v1
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">Endpoint reference</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              A focused, stable surface. Everything returns the same envelope, so one parser
              handles every call.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {ENDPOINT_GROUPS.map((g) => (
              <Card key={g.title} className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{g.title}</CardTitle>
                    <Badge tone={g.auth === "Public" ? "success" : "primary"}>{g.auth}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {g.endpoints.map(([ep, desc]) => (
                      <li key={ep} className="py-3">
                        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs text-primary">{ep}</code>
                        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
            Base URL is same-origin (<code className="text-primary">/api/v1</code>); a dedicated{" "}
            <code className="text-primary">api.ghbc.gabochie.com</code> host is reserved. Need an
            endpoint or a higher limit?{" "}
            <TrackedCta href="/contact" event="cta_dev_contact" className="text-primary underline underline-offset-2 hover:no-underline">
              Talk to us
            </TrackedCta>{" "}
            or email {SITE_CONTACT.email}.
          </p>
        </div>
      </section>

      <section className="mx-auto my-20 max-w-6xl px-6">
        <div className="rounded-2xl bg-sidebar px-8 py-12 text-center text-sidebar-foreground">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Get your API key.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            Create an account, open the API section in your dashboard and generate a scoped,
            revocable key in seconds.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <TrackedButton href="/register" event="cta_dev_footer_get_key" size="lg" className="bg-white text-slate-900 hover:opacity-90">
              Create an account
            </TrackedButton>
            <TrackedButton href="/login" event="cta_dev_signin" size="lg" variant="outline" className="border-slate-700 bg-transparent text-white hover:bg-slate-800">
              Sign in
            </TrackedButton>
          </div>
        </div>
      </section>
    </div>
  );
}
