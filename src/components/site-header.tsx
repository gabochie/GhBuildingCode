"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { TrackedButton } from "@/components/tracked-cta";

const NAV = [
  { href: "/academy", label: "Academy" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">G</span>
          <span>GHBC</span>
          <span className="hidden min-w-0 truncate text-xs font-normal text-muted-foreground md:inline">
            Ghana Building Compliance Intelligence
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          <TrackedButton href="/demo" event="cta_header_demo" variant="ghost" size="sm">Book a Demo</TrackedButton>
          <TrackedButton href="/login" event="cta_header_signin" variant="ghost" size="sm">Sign in</TrackedButton>
          <TrackedButton href="/register" event="cta_header_get_started" size="sm">Get started</TrackedButton>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Mobile"
          className="border-t border-border bg-background/95 px-4 pb-4 pt-2 md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            <TrackedButton href="/demo" event="cta_header_demo" variant="outline" size="sm" className="w-full">Book a Demo</TrackedButton>
            <div className="grid grid-cols-2 gap-2">
              <TrackedButton href="/login" event="cta_header_signin" variant="ghost" size="sm" className="w-full">Sign in</TrackedButton>
              <TrackedButton href="/register" event="cta_header_get_started" size="sm" className="w-full">Get started</TrackedButton>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}