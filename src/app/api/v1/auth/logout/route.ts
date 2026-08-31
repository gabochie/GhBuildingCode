import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ok } from "@/lib/api";

export async function POST() {
  (await cookies()).delete("ghbc_session");
  return ok({ logged_out: true });
}

export async function GET() {
  // GET is intentionally not implemented to prevent CSRF-style logout via <img>/<a> navigation.
  return new NextResponse("Method Not Allowed", { status: 405 });
}
