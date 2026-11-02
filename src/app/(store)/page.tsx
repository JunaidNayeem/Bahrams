import { ArrowRightIcon, QuoteIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProofStrip, WHY_BAHRAM_PROOF_ITEMS } from "@/components/brand/proof-strip";
import { SectionHeading } from "@/components/brand/section-heading";
import { StripeBand } from "@/components/brand/stripe-band";
import { ZariDivider } from "@/components/brand/zari-divider";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGrid } from "@/components/store/product-card";
import { buttonVariants } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { productUrl, routes, weaverUrl } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { listFeaturedProducts, listProductsInCollection } from "@/lib/data/catalog";
import { getHomeSections, listRecentReviews, listWeavers, type HomeSection } from "@/lib/data/cms";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

const str = (v: unknown) => (typeof v === "string" ? v : undefined);
const num = (v: unknown, fallback: number) => (typeof v === "number" ? v : fallback);

async function Hero({ section }: { section: HomeSection }) {
  const [lead] = await listFeaturedProducts(1);
  const ctaHref = str(section.config.cta_href) ?? routes.sarees;
  return (
    <section className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
      <div className="space-y-6">
        <p className="text-eyebrow text-gold-text uppercase">{siteConfig.tagline}</p>
        <h1 className="font-display text-display-2xl text-balance">
          {section.title ?? siteConfig.promise}
        </h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Tussar, ghicha, matka and raw silk from our own looms in Bhagalpur — every pure-silk piece
          sold with its Silk Mark number, and the weave in warp and weft stated plainly.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
            {str(section.config.cta_label) ?? "Shop sarees"}
          </Link>
          <Link href={routes.fabric} className={buttonVariants({ size: "lg", variant: "outline" })}>
            Fabric by the metre
          </Link>
        </div>
      </div>
      {lead?.image && (
        <Link href={productUrl(lead.slug)} className="relative block aspect-[4/5] overflow-hidden rounded-lg bg-muted md:justify-self-end md:w-[85%]">
          <Image
            src={lead.image.url}
            alt={lead.image.alt}
            fill
            priority
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-900/80 to-transparent p-5 text-ivory-50">
            <span className="block text-eyebrow uppercase">Featured</span>
            <span className="font-display text-xl">{lead.title}</span>
          </span>
        </Link>
      )}
    </section>
  );
}

function ShopByFabric({ section }: { section: HomeSection }) {
  const tiles = (Array.isArray(section.config.tiles) ? section.config.tiles : []) as {
    href: string;
    label: string;
  }[];
  return (
    <section className="container-page py-14">
      <SectionHeading title={section.title ?? "Shop by fabric"} align="center" divider />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link
              href={tile.href}
              className="group flex h-full flex-col justify-between gap-6 rounded-md border border-border bg-card p-5 transition-colors hover:border-gold-500"
            >
              <span className="font-display text-2xl">{tile.label}</span>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground">
                Shop <ArrowRightIcon className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function ProductRow({ section }: { section: HomeSection }) {
  const limit = num(section.config.limit, 8);
  const path = str(section.config.collection_path);
  const products = path ? await listProductsInCollection(path, limit) : await listFeaturedProducts(limit);
  if (products.length === 0) return null;
  return (
    <section className="container-page py-14">
      <SectionHeading
        title={section.title ?? "Bestsellers"}
        action={
          path ? (
            <Link href={path} className="text-sm font-medium underline-offset-4 hover:underline">
              View all
            </Link>
          ) : undefined
        }
      />
      <ProductGrid products={products} className="mt-8" />
    </section>
  );
}

async function WeaverStory({ section }: { section: HomeSection }) {
  const slugs = (Array.isArray(section.config.weaver_slugs) ? section.config.weaver_slugs : []) as string[];
  const weavers = await listWeavers(slugs);
  return (
    <section className="bg-ivory-200 py-16">
      <div className="container-page grid gap-10 md:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <SectionHeading title={section.title ?? "Meet the weavers"} />
          <p className="text-muted-foreground">
            Bhagalpur has some 30,000 handloom weavers on around 25,000 looms, in Nathnagar,
            Champanagar, Mirzafari and beyond. We credit the hands behind every piece.
          </p>
          <Link href={str(section.config.cta_href) ?? routes.weavers} className={buttonVariants({ variant: "outline" })}>
            Our weavers
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {weavers.map((w) => (
            <li key={w.slug} className="rounded-md border border-border bg-card p-5">
              <Link href={weaverUrl(w.slug)} className="font-display text-xl hover:underline">
                {w.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {w.locality}
                {w.yearsWeaving ? ` · ${w.yearsWeaving} years at the loom` : ""}
              </p>
              {w.bio && <p className="mt-3 line-clamp-3 text-sm">{w.bio}</p>}
              {w.isSample && <p className="mt-3 text-xs text-muted-foreground italic">Sample profile for development</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function Reviews({ section }: { section: HomeSection }) {
  const reviews = await listRecentReviews(num(section.config.limit, 6), num(section.config.min_rating, 4));
  if (reviews.length === 0) return null;
  return (
    <section className="container-page py-14">
      <SectionHeading title={section.title ?? "What customers say"} align="center" divider />
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 rounded-md border border-border bg-card p-6">
            <QuoteIcon className="size-5 text-gold-text" aria-hidden />
            <RatingStars rating={r.rating} size="sm" />
            {r.title && <p className="font-medium">{r.title}</p>}
            <p className="text-sm text-muted-foreground">{r.body}</p>
            <p className="mt-auto text-sm">
              {r.authorName}
              {r.authorCity ? `, ${r.authorCity}` : ""} ·{" "}
              <Link href={productUrl(r.productSlug)} className="underline-offset-4 hover:underline">
                {r.productTitle}
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Section({ section }: { section: HomeSection }) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} />;
    case "proof_strip":
      return (
        <div className="container-page py-6">
          <ProofStrip items={WHY_BAHRAM_PROOF_ITEMS} />
        </div>
      );
    case "shop_by_fabric":
      return <ShopByFabric section={section} />;
    case "collection_carousel":
    case "bestsellers":
      return <ProductRow section={section} />;
    case "weaver_story":
      return <WeaverStory section={section} />;
    case "reviews":
      return <Reviews section={section} />;
    default:
      return null;
  }
}

export default async function HomePage() {
  "use cache";
  const sections = await getHomeSections();
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      {sections.map((section, i) => (
        <div key={section.id}>
          {i === 1 && <StripeBand pattern="check" size="xs" />}
          <Section section={section} />
        </div>
      ))}
      <div className="container-page">
        <ZariDivider />
      </div>
    </>
  );
}
