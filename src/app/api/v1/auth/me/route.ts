import { getSession, getDbUser } from "@/lib/auth/session";
import { ok, unauthorized } from "@/lib/api";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  const user = await getDbUser(session);
  if (!user) return unauthorized();
  return ok({ user });
}
