import Link from "next/link";

import { StripeBand } from "@/components/brand/stripe-band";
import { Wordmark } from "@/components/brand/wordmark";
import { BrandMark } from "@/components/brand/brand-mark";
import { footerLegalLinks, footerNavigation } from "@/config/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { getStoreSettings } from "@/lib/data/settings";

/**
 * Seller identity, contact and grievance-officer details are required on the site by the
 * Consumer Protection (E-Commerce) Rules, 2020; they come from editable settings.
 */
export async function SiteFooter() {
  "use cache";
  const { legalEntity, grievanceOfficer } = await getStoreSettings();

  return (
    <footer className="mt-24 bg-charcoal-900 text-ivory-100">
      <StripeBand pattern="stripe" size="sm" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <BrandMark size={56} tone="reversed" decorative />
            <Wordmark tone="inverse" />
          </div>
          <p className="max-w-xs text-sm text-ivory-300">{siteConfig.promise}</p>
        </div>
        {footerNavigation.map((group) => (
          <nav key={group.label} aria-label={group.label}>
            <p className="text-eyebrow text-ivory-300 uppercase">{group.label}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page grid gap-6 py-8 text-xs text-ivory-300 md:grid-cols-2">
          <address className="space-y-1 not-italic">
            <p className="font-semibold text-ivory-100">{legalEntity.name}</p>
            {legalEntity.address && <p>{legalEntity.address}</p>}
            {legalEntity.gstin && <p>GSTIN {legalEntity.gstin}</p>}
            <p>
              {siteConfig.contact.email} · {siteConfig.contact.phone}
            </p>
          </address>
          <div className="space-y-1 md:text-right">
            <p>
              Grievance officer: {grievanceOfficer.name} ·{" "}
              <a href={`mailto:${grievanceOfficer.email}`} className="underline">
                {grievanceOfficer.email}
              </a>
            </p>
            <p>
              <Link href={routes.grievance} className="underline">
                Raise a grievance
              </Link>{" "}
              — we acknowledge within 48 hours and resolve within one month.
            </p>
          </div>
        </div>
        <nav
          aria-label="Legal"
          className="container-page flex flex-wrap gap-x-5 gap-y-2 pb-10 text-xs"
        >
          {footerLegalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-ivory-300 hover:text-ivory-100 hover:underline"
            >
              {link.label}
            </Link>
          ))}
          <span className="ml-auto text-ivory-300">© {siteConfig.name}</span>
        </nav>
      </div>
    </footer>
  );
}
