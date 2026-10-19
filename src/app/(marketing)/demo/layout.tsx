import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Demo",
  description: "See how GHBC's compliance intelligence platform helps architects, engineers, and developers navigate Ghana's Building Code (GS 1207:2018). Book a free demo.",
  openGraph: {
    title: "Book a Demo — GHBC",
    description: "See how GHBC's compliance intelligence platform helps architects, engineers, and developers navigate Ghana's Building Code (GS 1207:2018).",
    type: "website",
    siteName: "GHBC",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Book a demo of GHBC" }]
  }
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
