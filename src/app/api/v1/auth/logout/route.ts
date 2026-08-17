import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  (await cookies()).delete("ghbc_session");
  return NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000"));
}

export async function GET() {
  (await cookies()).delete("ghbc_session");
  return NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000"));
}
