import { getDb, now, uid } from "@/lib/db";

/**
 * Ensure the Clerk-authenticated user has a row in the local `users` table.
 *
 * The local `users.id` IS the Clerk user id, so all existing FK relationships
 * (projects, subscriptions, payments, feature_usage, audit_logs) keep working
 * unchanged. Clerk users have no local password (`password_hash` is NULL).
 *
 * This is called lazily from the session adapter (the single chokepoint every
 * authenticated page/API route goes through), so a user is provisioned on their
 * first authenticated request — no separate onboarding hook required.
 *
 * Returns the user row, creating it if absent.
 */
export async function syncClerkUser(input: {
  clerkId: string;
  email: string;
  name: string;
  /**
   * Optional role from Clerk user.publicMetadata.role ("admin"). When absent,
   * new users default to "user"; an existing row's role is never downgraded.
   */
  role?: string | null;
  plan?: string | null;
}): Promise<{ id: string; email: string; name: string; role: string; plan: string }> {
  const db = await getDb();
  const existing = (await db.prepare("SELECT id, email, name, role, plan FROM users WHERE id = ?").get(input.clerkId)) as
    | { id: string; email: string; name: string; role: string; plan: string }
    | undefined;
  if (existing) return existing;

  const role = input.role === "admin" ? "admin" : "user";
  const plan = input.plan?.toLowerCase() === "professional" || input.plan?.toLowerCase() === "studio" ? input.plan!.toLowerCase() : "free";
  await db
    .prepare(
      "INSERT INTO users (id, email, password_hash, name, role, plan, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)"
    )
    .run(input.clerkId, input.email.trim().toLowerCase(), input.name.trim() || "GHBC User", role, plan, now(), now());
  await db
    .prepare("INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json) VALUES (?, ?, 'register', 'user', ?, ?)")
    .run(uid("aud"), input.clerkId, input.clerkId, JSON.stringify({ provider: "clerk", email: input.email }));

  return { id: input.clerkId, email: input.email.trim().toLowerCase(), name: input.name.trim() || "GHBC User", role, plan };
}
