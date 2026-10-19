import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "./contact-form";
import { SITE_CONTACT } from "@/config/site-contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the GHBC team — email, phone, WhatsApp or the contact form. We're based in Tema, Ghana and reply within one business day."
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">Talk to the GHBC team</h1>
        <p className="mt-3 text-balance text-muted-foreground">
          Questions about compliance checks, pricing, the Academy or partnerships — reach us however suits you.
          We usually reply within one business day.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Mail className="h-4 w-4 text-primary" /> Email
            </h2>
            <a href={`mailto:${SITE_CONTACT.email}`} className="mt-2 block text-sm text-muted-foreground hover:text-foreground">
              {SITE_CONTACT.email}
            </a>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-primary" /> Phone
            </h2>
            <a href={SITE_CONTACT.phoneHref} className="mt-2 block text-sm text-muted-foreground hover:text-foreground">
              {SITE_CONTACT.phoneDisplay}
            </a>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
            </h2>
            <a
              href={SITE_CONTACT.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-sm text-muted-foreground hover:text-foreground"
            >
              Chat with us on WhatsApp
            </a>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Location
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{SITE_CONTACT.location}</p>
            <p className="mt-1 text-xs text-muted-foreground">Remote-first across Ghana — meetings by appointment.</p>
          </div>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
