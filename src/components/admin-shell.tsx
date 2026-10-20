"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { LayoutDashboard, Newspaper, Bot, ArrowLeft, LogOut, ShieldCheck, CreditCard, GraduationCap } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/blog", label: "Blog Manager", icon: Newspaper },
  { href: "/admin/content", label: "Content Pipeline", icon: Bot },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/academy", label: "Academy", icon: GraduationCap }
];

export function AdminShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <Link href="/admin" className="flex items-center gap-2 px-5 py-5 text-lg font-bold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          GHBC Admin
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {ADMIN_NAV.map((item) => {
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
          <div className="my-3 border-t border-white/10" />
          <Link
            href="/dashboard"
            className="mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="mb-2 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/30 text-sm font-bold uppercase">
              {user.name.slice(0, 1) || "A"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{user.name || "Admin"}</div>
              <div className="truncate text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" /> {signingOut ? "Signing out…" : "Sign out"}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="ml-60 flex min-h-screen flex-1 flex-col">
        <div className="flex-1 px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
