"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ClipboardList,
  Landmark,
  FileText,
  Bot,
  FileBarChart,
  Braces,
  UserRound,
  Settings2,
  LogOut,
  Mic,
  Menu,
  MoreHorizontal,
  X
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PwaInstallButton } from "@/components/pwa-install";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/code", label: "Code Explorer", icon: BookOpen },
  { href: "/learn", label: "Academy", icon: GraduationCap },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/permit", label: "Permit Readiness", icon: ClipboardList },
  { href: "/authorities", label: "Authorities", icon: Landmark },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/copilot", label: "AI Copilot", icon: Bot },
  { href: "/voice", label: "Voice Agent", icon: Mic },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/api", label: "API", icon: Braces },
  { href: "/account", label: "Account", icon: UserRound }
];

const BOTTOM_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/code", label: "Code", icon: BookOpen },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck }
];

export function AppShell({
  children,
  user,
  showAdmin
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; plan: string };
  showAdmin: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const nav = showAdmin
    ? [...NAV, { href: "/admin", label: "Admin Console", icon: Settings2 }]
    : NAV;

  const moreActive =
    drawerOpen ||
    !BOTTOM_NAV.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      router.push("/login");
    }
  }

  function SidebarContent() {
    return (
      <>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            G
          </span>
          GHBC
        </Link>
        <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/30 text-sm font-bold uppercase">
              {(user.name || "U").slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">
                {user.name || "User"}
              </div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-xs font-bold tracking-wide text-white">
              {user.plan?.toUpperCase() ?? "FREE"}
            </span>
            <Link href="/upgrade" className="text-xs font-medium text-primary hover:underline">
              {user.plan === "free" ? "Upgrade" : "Change"}
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />{" "}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
            <div className="flex items-center gap-1">
              <PwaInstallButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarContent />
      </aside>

      {drawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end border-b border-white/10 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4.5rem)] lg:ml-60 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
              G
            </span>
            GHBC
          </Link>
          <div className="flex items-center gap-1">
            <PwaInstallButton />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-8">
          <div>© {new Date().getFullYear()} GHBC · Ghana Building Compliance Intelligence · v0.1.0 MVP</div>
          <div className="flex flex-wrap items-center gap-3">
            <span>Preliminary intelligence — not a legal determination.</span>
            <Link href="/disclaimer" className="hover:text-foreground hover:underline">
              Disclaimer
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
          </div>
        </footer>
      </div>

      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
          {BOTTOM_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            aria-label="More menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium transition-colors",
              moreActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}