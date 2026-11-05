import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <p className="text-eyebrow text-gold-text uppercase">404</p>
      <h1 className="mt-2 font-display text-display-lg">This thread has run out</h1>
      <p className="mt-4 text-muted-foreground">
        The page you were looking for has moved or no longer exists. The piece may have been sold —
        one-of-a-kind sarees leave the shop for good.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={routes.sarees} className={buttonVariants()}>
          Shop sarees
        </Link>
        <Link href={routes.search} className={buttonVariants({ variant: "outline" })}>
          Search
        </Link>
      </div>
    </div>
  );
}
