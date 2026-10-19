import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require an authenticated session. These mirror the `(app)` and
// `(admin)` route groups, whose layouts already gate access — but layouts are
// not re-run on client-side navigation within a group, so enforcing here makes
// the middleware the authoritative server-side boundary for every request.
//
// Public by omission: marketing pages (/academy, /blog, /demo, /privacy, …),
// the auth pages (/sign-in, /sign-up, /login, …, owned by Clerk), /offline,
// and every /api route (each guards itself, and several are intentionally
// public: leads, search, agent API, billing + Twilio webhooks, cron).
const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/account(.*)",
  "/dashboard(.*)",
  "/projects(.*)",
  "/documents(.*)",
  "/compliance(.*)",
  "/copilot(.*)",
  "/reports(.*)",
  "/permit(.*)",
  "/upgrade(.*)",
  "/voice(.*)",
  "/code(.*)",
  "/authorities(.*)",
  // The API-keys management page lives at exactly /api (route group (app)).
  // No (.*) suffix: /api/v1/* are separate self-guarded API routes.
  "/api"
]);

// Clerk v7 requires `clerkMiddleware()` to be present for `auth()` to work in
// App Router server components/routes. Unauthenticated requests to protected
// pages are redirected to the app's Clerk sign-in page; non-document requests
// (RSC/fetch) receive a 404/401 from Clerk instead of a redirect.
export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect();
  },
  { signInUrl: "/sign-in" }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
