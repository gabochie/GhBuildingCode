import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function clearSession() {
  (await cookies()).delete("ghbc_session");
}

export async function POST() {
  clearSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // GET is intentionally not implemented to prevent CSRF-style logout via <img>/<a> navigation.
  return new NextResponse("Method Not Allowed", { status: 405 });
}
