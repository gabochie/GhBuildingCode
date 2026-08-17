import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo",
  description: "See how GHBC's compliance intelligence platform helps architects, engineers, and developers navigate Ghana's Building Code (GS 1207:2018). Book a free demo.",
  openGraph: {
    title: "Book a Demo — GHBC",
    description: "See how GHBC's compliance intelligence platform helps architects, engineers, and developers navigate Ghana's Building Code (GS 1207:2018).",
    type: "website"
  }
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
