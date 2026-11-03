import { SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Wordmark } from "@/components/brand/wordmark";
import { headerNavigation } from "@/config/navigation";
import { accountUrls, routes } from "@/config/routes";
import { getCartCount } from "@/lib/data/cart";

import { MobileNav } from "./mobile-nav";

async function CartCount() {
  const count = await getCartCount();
  if (count === 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
      {count}
      <span className="sr-only"> items</span>
    </span>
  );
}

const iconLink =
  "relative grid size-10 place-items-center rounded-md hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function SiteHeader({ announcement }: { announcement?: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {announcement && (
        <p className="bg-madder-900 px-4 py-2 text-center text-xs text-ivory-50">{announcement}</p>
      )}
      <div className="container-page flex h-16 items-center gap-2">
        <MobileNav items={headerNavigation} />
        <Link
          href={routes.home}
          className="mr-auto flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:mr-8"
        >
          <BrandMark size={36} decorative />
          <Wordmark size="sm" layout="inline" />
          <span className="sr-only">Bahram Silks home</span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 lg:block">
          <ul className="flex items-center gap-1">
            {headerNavigation.map((item) => (
              <li key={item.label} className="group/menu relative">
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {item.label}
                </Link>
                {/* CSS-only disclosure: opens on hover and on keyboard focus within. */}
                <div className="invisible absolute top-full left-0 z-50 min-w-max pt-2 opacity-0 transition-opacity group-focus-within/menu:visible group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:opacity-100">
                  <div className="flex gap-10 rounded-md border border-border bg-card p-6 shadow-card">
                    {item.groups.map((group) => (
                      <div key={group.label}>
                        <p className="text-eyebrow text-muted-foreground uppercase">
                          {group.label}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {group.links.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                className="block py-1 text-sm hover:text-primary hover:underline"
                              >
                                {link.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link href={routes.search} className={iconLink} aria-label="Search">
            <SearchIcon className="size-5" />
          </Link>
          <Link href={accountUrls.home} className={iconLink} aria-label="Your account">
            <UserIcon className="size-5" />
          </Link>
          <Link href={routes.cart} className={iconLink} aria-label="Shopping bag">
            <ShoppingBagIcon className="size-5" />
            <Suspense fallback={null}>
              <CartCount />
            </Suspense>
          </Link>
        </div>
      </div>
    </header>
  );
}
