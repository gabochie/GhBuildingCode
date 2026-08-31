import { cookies } from "next/headers";
import { verifySession } from "./tokens";
import type { SessionClaims } from "./tokens";
import { getDb } from "@/lib/db";

export type { SessionClaims };

const COOKIE_NAME = "ghbc_session";

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const claims = verifySession(token);
  if (!claims) return null;
  const db = await getDb();
  const user = (await db.prepare("SELECT plan FROM users WHERE id = ?").get(claims.sub)) as { plan: string } | undefined;
  if (!user) return null;
  return { ...claims, plan: user.plan };
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
  return (await db.prepare("SELECT id, email, name, role, plan FROM users WHERE id = ?").get(session.sub)) as
    | { id: string; email: string; name: string; role: string; plan: string }
    | undefined;
}
