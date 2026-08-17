import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free GHBC account to access compliance intelligence, project tools, and the AI copilot for the Ghana Building Code."
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
