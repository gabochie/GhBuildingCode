import { getSession, getDbUser } from "@/lib/auth/session";
import { ok, unauthorized, handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();
    const user = await getDbUser(session);
    if (!user) return unauthorized();
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}
