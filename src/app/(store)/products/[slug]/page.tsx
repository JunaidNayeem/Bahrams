import { BadgeCheckIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClaimBadge, type ClaimBadgeKey } from "@/components/brand/claim-badge";
import { ZariDivider } from "@/components/brand/zari-divider";
import { JsonLd } from "@/components/seo/json-ld";
import { BuyBox } from "@/components/store/buy-box";
import { DeliveryCheck } from "@/components/store/delivery-check";
import { ProductGallery } from "@/components/store/product-gallery";
import { VariantSelectionProvider } from "@/components/store/variant-selection";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/ui/rating-stars";
import { absoluteUrl, CATALOGUE_SECTIONS, productUrl, routes, weaverUrl } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { listProductSlugs } from "@/lib/data/catalog";
import { getAvailability, getProduct, type ProductDetail } from "@/lib/data/product";
import { getStoreSettings } from "@/lib/data/settings";
import {
  CLAIM_BADGE_LABELS,
  compositionLabel,
  fibreLabel,
} from "@/lib/domain/claims";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { productMetadata } from "@/lib/seo/metadata";
import {
  DEFAULT_RETURN_POLICY,
  NOT_RETURNABLE,
  productGroupJsonLd,
  productJsonLd,
} from "@/lib/seo/product-jsonld";
import { slugParamsOrPlaceholder } from "@/lib/static-params";
import {
  firstImageByVariant,
  imagesForVariant,
  variantLabel,
  variantPath,
  variesByOf,
} from "@/lib/domain/variants";

type Props = PageProps<"/products/[slug]">;

export async function generateStaticParams() {
  return slugParamsOrPlaceholder((await listProductSlugs()).map(({ slug }) => slug));
}

export async function generateMetadata({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  // Share image: the main photo of the design the page opens on.
  const [main] = imagesForVariant(product.images, product.variants[0]?.id);
  return productMetadata({
    name: product.title,
    slug: product.slug,
    description: product.subtitle ?? product.composition,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    productType: fibreLabel(product.primaryFibre),
    image: main ? { url: main.url, alt: main.alt } : null,
    noindex: product.noindex,
  });
}

const OCCASION_TEXT: Record<string, string> = {
  office: "Office",
  festive: "Festive",
  wedding: "Wedding",
  puja: "Puja",
  gifting: "Gifting",
};

function Specs({ product }: { product: ProductDetail }) {
  const rows: [string, string | null][] = [
    ["Composition", product.composition],
    ["Warp and weft", compositionLabel(product.fibreWarp, product.fibreWeft)],
    ["Weave", product.weave],
    ["Zari", product.zari],
    ["Saree length", product.lengthM ? `${product.lengthM} m` : null],
    [
      "Blouse piece",
      product.blouseIncluded
        ? product.blouseLengthM
          ? `Included, ${product.blouseLengthM} m`
          : "Included"
        : product.kind === "saree"
          ? "Not included"
          : null,
    ],
    ["Fabric width", product.widthCm ? `${product.widthCm} cm` : null],
    ["Weight", product.weightG ? `About ${product.weightG} g` : null],
    ["Occasions", product.occasions.map((o) => OCCASION_TEXT[o] ?? o).join(", ") || null],
    ["Origin", product.claims.originLabel],
  ];
  return (
    <dl className="divide-y divide-border text-sm">
      {rows
        .filter((r): r is [string, string] => Boolean(r[1]))
        .map(([k, v]) => (
          <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-2.5">
            <dt className="text-muted-foreground">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Shown only for products with the GI tag ticked in the admin. */
function GiTag({ product }: { product: ProductDetail }) {
  if (!product.giEligible) return null;
  return (
    <section
      aria-labelledby="gi-tag"
      className="space-y-3 rounded-md border border-gold-300 bg-ivory-200/60 p-5"
    >
      <h2 id="gi-tag" className="flex items-center gap-2 font-display text-xl">
        <BadgeCheckIcon className="size-5 text-gold-text" aria-hidden /> Bhagalpur Silk (GI)
      </h2>
      <p className="text-sm">
        Woven by the traditional process in Bhagalpur, so it is sold as Bhagalpur Silk (GI),
        registered in 2013. Fibre in warp and weft: {product.composition}.
      </p>
    </section>
  );
}

async function Purchase({ product }: { product: ProductDetail }) {
  const availability = await getAvailability(product.variants.map((v) => v.id));
  const variantThumbs = Object.fromEntries(
    [...firstImageByVariant(product.images)].map(([id, img]) => [id, img.url]),
  );
  return (
    <BuyBox
      productTitle={product.title}
      productUrl={absoluteUrl(productUrl(product.slug))}
      isOneOfAKind={product.isOneOfAKind}
      madeToOrder={product.madeToOrder}
      leadTimeDays={product.leadTimeDays}
      variants={product.variants}
      availability={availability}
      variantThumbs={variantThumbs}
      whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? siteConfig.contact.whatsapp}
    />
  );
}

async function ProductJsonLd({ product }: { product: ProductDetail }) {
  "use cache";
  const settings = await getStoreSettings();
  const shipping = {
    flatRatePaise: settings.shippingFeePaise,
    freeAbovePaise: settings.freeShippingThresholdPaise,
    handlingDays: { min: 1, max: 2 },
    transitDays: { min: 2, max: 7 },
  };
  const many = product.variants.length > 1;
  const variants = product.variants.map((v) => ({
    name: many && (v.title || v.colour) ? `${product.title} — ${variantLabel(v)}` : product.title,
    slug: product.slug,
    // Each design has its own URL (?variant=<sku>) that preselects it, as Google asks of variants.
    path: many ? variantPath(productUrl(product.slug), v.sku) : undefined,
    description: product.subtitle ?? product.composition,
    images: imagesForVariant(product.images, v.id).map((i) => i.url),
    sku: v.sku,
    pricePaise: v.pricePaise,
    sellUnit: v.sellUnit,
    // Live stock is not in the cached page; Merchant Center re-crawls availability from the feed.
    availability: product.madeToOrder ? ("made_to_order" as const) : ("in_stock" as const),
    material: fibreLabel(product.primaryFibre),
    color: v.colour ?? undefined,
    shipping,
    returns: product.returnable ? DEFAULT_RETURN_POLICY : NOT_RETURNABLE,
    rating:
      product.ratingAvg !== null && product.ratingCount > 0
        ? { average: product.ratingAvg, count: product.ratingCount }
        : null,
    reviews: product.reviews.slice(0, 5).map((r) => ({
      authorName: r.authorName,
      rating: r.rating,
      datePublished: r.createdAt.slice(0, 10),
      title: r.title ?? undefined,
      body: r.body,
    })),
  }));
  const section = CATALOGUE_SECTIONS[product.kind];
  const ld =
    variants.length > 1
      ? productGroupJsonLd({
          name: product.title,
          slug: product.slug,
          description: product.subtitle ?? product.composition,
          productGroupId: product.id,
          variesBy: variesByOf(product.variants),
          images: product.images.map((i) => i.url),
          material: fibreLabel(product.primaryFibre),
          variants,
        })
      : productJsonLd(variants[0]!);
  return (
    <JsonLd
      data={[
        ld,
        breadcrumbJsonLd([
          { name: "Home", path: routes.home },
          { name: section.label, path: section.path },
          { name: product.title, path: productUrl(product.slug) },
        ]),
      ]}
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-10 py-8 lg:grid-cols-[1.15fr_1fr]">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

// params is read inside <Suspense> so the route shell can render before the slug resolves.
export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Props["params"] }) {
  const product = await getProduct((await params).slug);
  if (!product || product.variants.length === 0) notFound();
  const section = CATALOGUE_SECTIONS[product.kind];

  return (
    <article className="container-page py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href={routes.home} className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href={section.path} className="hover:underline">
          {section.label}
        </Link>{" "}
        / <span aria-current="page">{product.title}</span>
      </nav>

      {/* Shares the chosen design between the gallery and the buy box. */}
      <VariantSelectionProvider variants={product.variants}>
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <ProductGallery images={product.images} title={product.title} />

          <div className="space-y-6">
            <header className="space-y-3">
              <p className="text-eyebrow text-gold-text uppercase">
                {fibreLabel(product.primaryFibre)} · {product.claims.originLabel}
              </p>
              <h1 className="font-display text-display-lg">{product.title}</h1>
              {product.subtitle && <p className="text-muted-foreground">{product.subtitle}</p>}
              {product.ratingCount > 0 && product.ratingAvg !== null && (
                <a href="#reviews" className="inline-block">
                  <RatingStars rating={product.ratingAvg} count={product.ratingCount} />
                </a>
              )}
              {/* Badges come only from computeClaims(): no record, no badge. */}
              <ul className="flex flex-wrap gap-2" aria-label="Certifications">
                {product.claims.badges.map((badge) => (
                  <li key={badge}>
                    {badge === "woven_in_bhagalpur" ? (
                      <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs">
                        {CLAIM_BADGE_LABELS[badge]}
                      </span>
                    ) : (
                      <ClaimBadge
                        claim={badge as ClaimBadgeKey}
                        label={CLAIM_BADGE_LABELS[badge]}
                        detail={
                          badge === "silk_mark"
                            ? (product.claims.silkMarkLabelNumber ?? undefined)
                            : undefined
                        }
                        size="sm"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </header>

            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <Purchase product={product} />
            </Suspense>

            <DeliveryCheck
              madeToOrderLeadDays={product.madeToOrder ? product.leadTimeDays : null}
            />

            <p className="text-sm text-muted-foreground">
              {product.returnable
                ? "Easy 7-day exchange or store credit, with free reverse pickup. Refund to source on request."
                : "Cut-to-order and final-sale items can't be returned; we'll always fix a defect."}{" "}
              <Link href="/help/returns" className="underline">
                Returns policy
              </Link>
            </p>
          </div>
        </div>
      </VariantSelectionProvider>

      <div className="mt-16 grid gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-10">
          {product.descriptionHtml && (
            <section aria-labelledby="about" className="space-y-3">
              <h2 id="about" className="font-display text-display-sm">
                About this piece
              </h2>
              {/* Rich text is sanitised by the admin editor on save; only staff can write it (RLS). */}
              <div
                className="max-w-prose space-y-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            </section>
          )}
          <section aria-labelledby="details" className="space-y-3">
            <h2 id="details" className="font-display text-display-sm">
              Details
            </h2>
            <Specs product={product} />
          </section>
          {product.care && (
            <section aria-labelledby="care" className="space-y-2">
              <h2 id="care" className="font-display text-display-sm">
                Care
              </h2>
              <p className="max-w-prose text-sm leading-relaxed">{product.care}</p>
            </section>
          )}
        </div>
        <aside className="space-y-6">
          <GiTag product={product} />
          {product.weaver && (
            <section className="rounded-md border border-border p-5">
              <p className="text-eyebrow text-muted-foreground uppercase">Woven by</p>
              <Link
                href={weaverUrl(product.weaver.slug)}
                className="font-display text-xl hover:underline"
              >
                {product.weaver.name}
              </Link>
              {product.weaver.locality && (
                <p className="text-sm text-muted-foreground">
                  {product.weaver.locality}, Bhagalpur
                </p>
              )}
            </section>
          )}
        </aside>
      </div>

      <section id="reviews" aria-labelledby="reviews-title" className="mt-16 space-y-6">
        <ZariDivider />
        <h2 id="reviews-title" className="font-display text-display-sm">
          Reviews
        </h2>
        {product.reviews.length === 0 ? (
          <p className="text-muted-foreground">
            No reviews yet. Bought this piece? We&apos;d love to hear from you.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {product.reviews.map((r) => (
              <li key={r.id} className="space-y-2 rounded-md border border-border p-5">
                <RatingStars rating={r.rating} size="sm" />
                {r.title && <p className="font-medium">{r.title}</p>}
                <p className="text-sm">{r.body}</p>
                <p className="text-xs text-muted-foreground">
                  {r.authorName}
                  {r.authorCity ? `, ${r.authorCity}` : ""}
                  {r.verifiedPurchase ? " · Verified purchase" : ""}
                </p>
                {r.replyBody && (
                  <p className="border-l-2 border-gold-500 pl-3 text-sm text-muted-foreground">
                    Bahram Silks: {r.replyBody}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductJsonLd product={product} />
    </article>
  );
}
