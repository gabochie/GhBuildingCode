import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your GHBC account to access compliance intelligence, project tools, and the AI copilot."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
