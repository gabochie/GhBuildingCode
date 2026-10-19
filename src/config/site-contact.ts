// Single source of truth for publicly published contact details.
// Social hrefs ship as null until real profiles exist — the footer hides any
// platform without an href (never render dead social links).
// When you have the URLs, fill them here and they appear automatically.

export const SITE_CONTACT = {
  email: "support@ghbc.gabochie.com",
  phoneDisplay: "+233 24 326 2019",
  phoneHref: "tel:+233243262019",
  whatsappHref: "https://wa.me/233243262019",
  location: "Klagon Newsite, Tema, Ghana",
  streetAddress: "Klagon Newsite",
  addressLocality: "Tema",
  addressCountry: "GH"
} as const;

export type SocialPlatform = "x" | "linkedin" | "facebook" | "instagram" | "youtube" | "tiktok";

export const SOCIALS: ReadonlyArray<{ name: SocialPlatform; label: string; href: string | null }> = [
  { name: "x", label: "X (Twitter)", href: null },
  { name: "linkedin", label: "LinkedIn", href: null },
  { name: "facebook", label: "Facebook", href: null },
  { name: "instagram", label: "Instagram", href: null },
  { name: "youtube", label: "YouTube", href: null },
  { name: "tiktok", label: "TikTok", href: null }
];
