import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <AppShell
      user={{ name: session.name, email: session.email, role: session.role, plan: session.plan }}
      showAdmin={session.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
