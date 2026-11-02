import Image from "next/image";
import Link from "next/link";

import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating-stars";
import { productUrl } from "@/config/routes";
import type { ProductCard as ProductCardData } from "@/lib/data/catalog";
import { fibreLabel } from "@/lib/domain/claims";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: ProductCardData;
  /** Set on the first row of a grid so the LCP image loads eagerly. */
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const fromPrice = product.priceMaxPaise > product.priceMinPaise;
  return (
    <article className={cn("group relative flex flex-col gap-3", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
        {product.image ? (
          <>
            <Image
              src={product.image.url}
              alt={product.image.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-opacity duration-300"
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage.url}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden"
              />
            )}
          </>
        ) : null}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.isOneOfAKind && (
            <span className="rounded-sm bg-card/95 px-2 py-0.5 text-xs font-medium text-foreground">
              One of a kind
            </span>
          )}
          {product.madeToOrder && (
            <span className="rounded-sm bg-card/95 px-2 py-0.5 text-xs font-medium text-foreground">
              Made to order
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {fibreLabel(product.primaryFibre)}
          {product.giEligible && " · GI Bhagalpur"}
        </p>
        <h3 className="font-display text-lg leading-snug">
          <Link
            href={productUrl(product.slug)}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-md after:focus-visible:ring-2 after:focus-visible:ring-ring"
          >
            {product.title}
          </Link>
        </h3>
        <div className="flex items-baseline gap-1 text-sm">
          {fromPrice && <span className="text-muted-foreground">From</span>}
          <Price pricePaise={product.priceMinPaise} unit={product.sellUnit} size="sm" />
        </div>
        {product.ratingCount > 0 && product.ratingAvg !== null && (
          <RatingStars rating={product.ratingAvg} count={product.ratingCount} size="sm" />
        )}
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
}: {
  products: ProductCardData[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
