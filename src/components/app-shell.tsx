"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
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
  Newspaper
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/code", label: "Code Explorer", icon: BookOpen },
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

  const nav = showAdmin
    ? [...NAV, { href: "/admin", label: "Admin", icon: Settings2 }, { href: "/admin/blog", label: "Blog Manager", icon: Newspaper }, { href: "/admin/content", label: "Content Pipeline", icon: Bot }]
    : NAV;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-sidebar text-sidebar-foreground">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">G</span>
          GHBC
        </Link>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
              {user.name.slice(0, 1) || "U"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{user.name || "User"}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <div className="mb-2 flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
            <span className="text-xs font-bold tracking-wide text-white">{user.plan?.toUpperCase() ?? "FREE"}</span>
            <Link href="/upgrade" className="text-xs font-medium text-primary hover:underline">
              {user.plan === "free" ? "Upgrade" : "Change"}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <Link
              href="/api/v1/auth/logout"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="ml-60 flex min-h-screen flex-1 flex-col">
        <div className="flex-1 px-8 py-8">{children}</div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-8 py-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} GHBC · Ghana Building Compliance Intelligence · v0.1.0 MVP</div>
          <div className="flex items-center gap-3">
            <span>Preliminary intelligence — not a legal determination.</span>
            <Link href="/disclaimer" className="hover:text-foreground hover:underline">Disclaimer</Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
