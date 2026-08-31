import { auth, clerkClient } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { effectivePlan } from "@/lib/billing/subscriptions";
import { syncClerkUser } from "./clerk-sync";

export interface SessionClaims {
  sub: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

export type { SessionClaims as Session };

/**
 * Clerk adapter that preserves the legacy `SessionClaims` shape used across the
 * app, so API routes and pages keep calling `getSession()`/`getDbUser()`.
 *
 * Session = a signed-in Clerk user. The local `users.id` is the Clerk user id;
 * `syncClerkUser` provisions the row on first authenticated request. Role/plan
 * (including the effective paid-subscription plan and grace period) come from
 * the DB via `effectivePlan`.
 */
export async function getSession(): Promise<SessionClaims | null> {
  if (!clerkConfigured()) return null;
  const { userId } = await auth();
  if (!userId) return null;

  const db = await getDb();
  const user = (await db.prepare("SELECT email, name, role FROM users WHERE id = ?").get(userId)) as
    | { email: string; name: string; role: string }
    | undefined;

  let email: string;
  let name: string;
  let role: string;

  if (user) {
    email = user.email;
    name = user.name;
    role = user.role;
  } else {
    // First-time provisioning: pull accurate email/name from Clerk's Backend
    // API, then create the local row (id = Clerk userId).
    try {
      const clerkUser = await (await clerkClient()).users.getUser(userId);
      email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
      name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() || "";
      const metaRole = (clerkUser.publicMetadata?.role as string | undefined) ?? null;
      const created = await syncClerkUser({
        clerkId: userId,
        email: email || `${userId}@clerk.local`,
        name: name || "GHBC User",
        role: metaRole,
        plan: (clerkUser.publicMetadata?.plan as string | undefined) ?? null
      });
      email = created.email;
      name = created.name;
      role = created.role;
    } catch {
      // Provisioning failed — treat as signed out so callers redirect to /login.
      return null;
    }
  }

  const plan = (await effectivePlan(userId)).id;
  return { sub: userId, email, name, role, plan };
}

export async function requireSession(): Promise<SessionClaims> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireAdmin(): Promise<SessionClaims> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}

export async function getDbUser(session: SessionClaims) {
  const db = await getDb();
  const user = (await db.prepare("SELECT id, email, name, role, plan FROM users WHERE id = ?").get(session.sub)) as
    | { id: string; email: string; name: string; role: string; plan: string }
    | undefined;
  if (!user) return undefined;
  return { ...user, plan: (await effectivePlan(user.id)).id };
}

/** Clerk is only active when its env keys are configured. */
export function clerkConfigured(): boolean {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}
