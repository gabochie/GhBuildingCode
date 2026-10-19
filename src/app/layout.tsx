import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/cn";
import { PwaRegister } from "@/components/pwa-install";
import { SITE_CONTACT, SOCIALS } from "@/config/site-contact";

const APP_URL = process.env.APP_URL || "https://ghbc.gabochie.com";

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
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: "website",
    siteName: "GHBC",
    title: "GHBC — Ghana Building Compliance Intelligence",
    description:
      "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018). Search 27,000+ requirements, check your project, build with confidence.",
    url: APP_URL,
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: "GHBC — Ghana Building Compliance Intelligence" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "GHBC — Ghana Building Compliance Intelligence",
    description:
      "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018). Search 27,000+ requirements, check your project.",
    images: [`${APP_URL}/og-default.png`]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
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
    url: APP_URL,
    description: "AI-powered compliance intelligence for the Ghana Building Code (GS 1207:2018).",
    foundingDate: "2025",
    areaServed: { "@type": "Country", name: "Ghana" },
    knowsAbout: ["GS 1207:2018", "Ghana Building Code", "building compliance", "construction safety"],
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONTACT.streetAddress,
      addressLocality: SITE_CONTACT.addressLocality,
      addressCountry: SITE_CONTACT.addressCountry
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SITE_CONTACT.email,
      telephone: SITE_CONTACT.phoneHref.replace("tel:", ""),
      availableLanguage: ["English"]
    },
    ...(SOCIALS.some((s) => s.href)
      ? { sameAs: SOCIALS.map((s) => s.href).filter(Boolean) as string[] }
      : {})
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
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
