import { MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";

import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { storeJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Contact us",
  description:
    "Talk to Bahram Silks in Bhagalpur: WhatsApp, phone or email for help choosing a saree, video-call shopping, orders and bulk fabric enquiries.",
  path: routes.contact,
});

export default function ContactPage() {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? siteConfig.contact.whatsapp;
  const items = [
    { icon: MessageCircleIcon, label: "WhatsApp", value: "Chat or book a video call", href: `https://wa.me/${whatsapp}` },
    { icon: PhoneIcon, label: "Phone", value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone.replace(/[^+\d]/g, "")}` },
    { icon: MailIcon, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
    { icon: MapPinIcon, label: "Visit", value: siteConfig.contact.address, href: null },
  ];
  return (
    <div className="container-page max-w-3xl py-12">
      <SectionHeading
        as="h1"
        title="Contact us"
        description="We're a small team in Bhagalpur. Message us about any piece — we'll send extra photos or a short video in daylight."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex gap-4 rounded-md border border-border bg-card p-5">
            <Icon className="mt-0.5 size-5 shrink-0 text-gold-text" aria-hidden />
            <div>
              <p className="font-medium">{label}</p>
              {href ? (
                <a href={href} className="text-sm underline-offset-4 hover:underline" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>
                  {value}
                </a>
              ) : (
                <p className="text-sm">{value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <JsonLd data={storeJsonLd()} />
    </div>
  );
}
