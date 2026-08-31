import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSession, type SessionClaims } from "@/lib/auth/session";
import { getPlan } from "@/lib/billing/plans";

export interface ApiEnvelope {
  request_id: string;
  timestamp: string;
  status: "ok" | "error";
  data: unknown;
  warnings: string[];
  sources: unknown[];
}

export function envelope(status: "ok" | "error", data: unknown, opts: { warnings?: string[]; sources?: unknown[] } = {}): ApiEnvelope {
  return {
    request_id: randomUUID(),
    timestamp: new Date().toISOString(),
    status,
    data,
    warnings: opts.warnings ?? [],
    sources: opts.sources ?? []
  };
}

export function ok(data: unknown, opts?: { warnings?: string[]; sources?: unknown[] }) {
  return NextResponse.json(envelope("ok", data, opts), { status: 200 });
}

export function created(data: unknown) {
  return NextResponse.json(envelope("ok", data), { status: 201 });
}

export function badRequest(message: string) {
  return NextResponse.json(envelope("error", { error: message }), { status: 400 });
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json(envelope("error", { error: message }), { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json(envelope("error", { error: message }), { status: 403 });
}

export function notFound(message = "Not found") {
  return NextResponse.json(envelope("error", { error: message }), { status: 404 });
}

export function limitReached(feature: string, used: number, limit: number, planId: string, message?: string) {
  const plan = getPlan(planId);
  return NextResponse.json(
    envelope("error", {
      error:
        message ??
        `Your ${plan.label} plan limit for ${feature} has been reached (${used} of ${limit}). Upgrade to continue.`,
      code: "LIMIT_REACHED",
      feature,
      used,
      limit,
      plan: plan.id
    }),
    { status: 429 }
  );
}

export function serverError(message = "Internal error") {
  return NextResponse.json(envelope("error", { error: message }), { status: 500 });
}

export async function requireUserOrResponse(): Promise<SessionClaims | NextResponse> {
  const session = await getSession();
  if (!session) return unauthorized();
  return session;
}

export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Unknown error";
  if (msg === "UNAUTHENTICATED") return unauthorized();
  if (msg === "FORBIDDEN") return forbidden();
  console.error("[api]", e);
  if (process.env.NODE_ENV === "production") {
    return serverError("Internal error");
  }
  return serverError(msg);
}
