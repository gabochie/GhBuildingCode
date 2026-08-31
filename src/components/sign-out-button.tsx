"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  const { signOut } = useClerk();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <button type="button" onClick={handleSignOut} className={className}>
      {label}
    </button>
  );
}
