import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk v7 requires `clerkMiddleware()` to be present for `auth()` to work in
// App Router server components/routes. GHBC gates protected routes server-side
// in its (app)/(admin) layouts, so this middleware performs no redirect logic —
// it only surfaces the auth context. Matcher excludes static assets/_next while
// covering pages and API routes (including the public landing page).
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
