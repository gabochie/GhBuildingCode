import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to GHBC — compliance intelligence for the Ghana Building Code (GS 1207:2018)."
};

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      <p className="text-xs text-muted-foreground">
        New to GHBC?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">Create a free account</Link>
      </p>
    </main>
  );
}
