import { HammerIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

/**
 * Placeholder for routes that are in the backlog but not built yet, so navigation never dead-ends.
 * Pages using it must set noindex metadata.
 */
export function ComingSoon({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-2xl py-20 text-center">
      <HammerIcon className="mx-auto size-8 text-gold-text" aria-hidden />
      <h1 className="mt-4 font-display text-display-lg">{title}</h1>
      <div className="mt-4 space-y-3 text-muted-foreground">{children}</div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={routes.sarees} className={buttonVariants()}>
          Shop sarees
        </Link>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? siteConfig.contact.whatsapp}`}
          target="_blank"
          rel="noopener"
          className={buttonVariants({ variant: "outline" })}
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
