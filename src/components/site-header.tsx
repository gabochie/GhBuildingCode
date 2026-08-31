import Link from "next/link";
import { Button } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/blog", label: "Blog" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">G</span>
          <span>GHBC</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
            Ghana Building Compliance Intelligence
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
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
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/demo">
            <Button variant="ghost" size="sm">Book a Demo</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
