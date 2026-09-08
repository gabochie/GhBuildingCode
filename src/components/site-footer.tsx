import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";

const COLUMNS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: "Product",
    links: [
      { href: "/register", label: "Check a Project" },
      { href: "/demo", label: "Book a Demo" },
      { href: "/login", label: "Sign in" }
    ]
  },
  {
    title: "Resources",
    links: [
      { href: "/academy", label: "Building Code Academy" },
      { href: "/blog", label: "Blog" },
      { href: "/blog/feed.xml", label: "RSS Feed" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/terms", label: "Terms of Use" },
      { href: "/privacy", label: "Privacy Policy" }
    ]
  }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">G</span>
              GHBC
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Source-backed compliance intelligence for the Ghana Building Code (GS 1207:2018) — built for architects,
              engineers, developers, fire-safety professionals and building control.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Every finding traces to its regulatory source: document, part, section, clause and page.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 md:flex-row md:items-center">
          <div className="max-w-xs">
            <h3 className="text-sm font-semibold">Compliance updates, in your inbox</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              New GS 1207 guidance and permit changes — a few times a month, no spam.
            </p>
          </div>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} GHBC · A <a href="https://gabochie.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">Gabochie Design</a> Product</div>
          <div className="flex items-center gap-4">
            <span>ghbc.gabochie.com</span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span>GS 1207:2018</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
