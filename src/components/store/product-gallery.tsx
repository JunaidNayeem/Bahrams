"use client";

import Image from "next/image";
import { useState } from "react";

import type { ProductImage } from "@/lib/data/catalog";
import { imagesForVariant } from "@/lib/domain/variants";
import { cn } from "@/lib/utils";

import { useVariantSelection } from "./variant-selection";

/** Shows the selected design's own photos, then shared ones; never another design's photos. */
export function ProductGallery({ images, title }: { images: ProductImage[]; title: string }) {
  const selectedId = useVariantSelection()?.selectedId;
  // Keyed by design so the first photo shows again whenever the shopper picks another design.
  return (
    <Gallery
      key={selectedId ?? "all"}
      images={imagesForVariant(images, selectedId)}
      title={title}
    />
  );
}

function Gallery({ images, title }: { images: ProductImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  if (!current) return <div className="aspect-[4/5] rounded-md bg-muted" />;

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <ul className="flex gap-2 md:flex-col" aria-label={`${title} photos`}>
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}: ${img.alt}`}
                aria-pressed={i === active}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-md border-2 md:size-20",
                  i === active
                    ? "border-foreground"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Full-resolution image opens in a new tab so the texture can be inspected at 100%. */}
      <a
        href={current.url}
        target="_blank"
        rel="noopener"
        className="relative block aspect-[4/5] flex-1 overflow-hidden rounded-md bg-muted"
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority={active === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <span className="sr-only">Open full-size photo</span>
      </a>
    </div>
  );
}
