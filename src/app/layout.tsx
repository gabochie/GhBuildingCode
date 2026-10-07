import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/cn";
import { PwaRegister } from "@/components/pwa-install";

export const metadata: Metadata = {
  title: {
    default: "GHBC — Ghana Building Compliance Intelligence",
    template: "%s · GHBC"
  },
  description:
    "The AI-powered compliance intelligence layer for building design and construction in Ghana. Understand the requirements, check your project, find what's missing, build with confidence.",
  keywords: ["Ghana", "building code", "GS 1207:2018", "compliance", "permits", "architecture", "construction"],
  manifest: "/manifest.webmanifest",
  applicationName: "GHBC",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "GHBC",
    statusBarStyle: "black-translucent"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" }
  ]
};

const THEME_INIT = `
(function(){
  var t=localStorage.getItem('ghbc-theme');
  if(!t)t='system';
  var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);
  document.documentElement.classList.toggle('dark',d);
  if(t!=='light'&&t!=='dark')document.documentElement.setAttribute('data-theme','system');
  else document.documentElement.setAttribute('data-theme',t);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GHBC",
    alternateName: "Ghana Building Compliance Intelligence",
    url: "https://ghbc.gabochie.com",
    description: "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018).",
    foundingDate: "2025",
    areaServed: { "@type": "Country", name: "Ghana" },
    knowsAbout: ["GS 1207:2018", "Ghana Building Code", "building compliance", "construction safety"]
  };

  // Privacy-first, cookie-free analytics (Plausible). Only active when the
  // domain is configured; otherwise nothing is loaded.
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        {plausibleDomain ? (
          <script defer data-domain={plausibleDomain} src="https://plausible.io/js/script.js" />
        ) : null}
      </head>
      <body className={cn("min-h-screen antialiased")}>
        <PwaRegister />
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
