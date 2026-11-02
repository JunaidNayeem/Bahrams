import { ShoppingBagIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { CartLineControls } from "@/components/store/cart-line-controls";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { Skeleton } from "@/components/ui/skeleton";
import { productUrl, routes } from "@/config/routes";
import { getCart } from "@/lib/data/cart";
import { getStoreSettings } from "@/lib/data/settings";
import { formatINR } from "@/lib/domain/money";
import { formatQuantity } from "@/lib/domain/quantity";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = noindexMetadata("Your bag", routes.cart);

async function CartContents() {
  const [cart, settings] = await Promise.all([getCart(), getStoreSettings()]);

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBagIcon}
        title="Your bag is empty"
        description="Start with our tussar sarees, or fabric by the metre for your tailor."
        action={
          <Link href={routes.sarees} className={buttonVariants()}>
            Shop sarees
          </Link>
        }
      />
    );
  }

  const { totals } = cart;
  const toFree = totals.shipping.amountToFreeShippingPaise;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <section aria-label="Items in your bag">
        {cart.removedCount > 0 && (
          <p className="mb-4 rounded-md bg-warning/10 p-3 text-sm">
            {cart.removedCount === 1 ? "One item is" : `${cart.removedCount} items are`} no longer available and{" "}
            {cart.removedCount === 1 ? "was" : "were"} removed.
          </p>
        )}
        <ul className="divide-y divide-border border-y border-border">
          {cart.lines.map((line) => {
            const short = line.available < line.quantity;
            return (
              <li key={line.variantId} className="flex gap-4 py-5">
                <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                  {line.image && <Image src={line.image.url} alt={line.image.alt} fill sizes="96px" className="object-cover" />}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link href={productUrl(line.productSlug)} className="font-display text-lg hover:underline">
                        {line.productTitle}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {[line.colour ?? line.variantTitle, formatQuantity(line.quantity, line.sellUnit), line.sku]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Price pricePaise={totals.lines.find((t) => t.id === line.variantId)?.lineTotalPaise ?? 0} />
                  </div>
                  {line.sellUnit === "metre" && (
                    <p className="text-xs text-muted-foreground">
                      <Price pricePaise={line.unitPricePaise} unit="metre" size="sm" />
                    </p>
                  )}
                  {short && (
                    <p className="text-sm text-destructive">
                      {line.available === 0
                        ? line.isOneOfAKind
                          ? "This one-of-a-kind piece has been reserved or sold."
                          : "Out of stock."
                        : `Only ${formatQuantity(line.available, line.sellUnit)} left.`}
                    </p>
                  )}
                  <CartLineControls
                    variantId={line.variantId}
                    title={line.productTitle}
                    sellUnit={line.sellUnit}
                    quantity={line.quantity}
                    minQty={line.minQty}
                    maxQty={Math.min(line.maxQty ?? Infinity, line.available, line.sellUnit === "metre" ? 100 : 10)}
                    fixedQuantity={line.isOneOfAKind}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <aside aria-labelledby="summary" className="h-fit space-y-4 rounded-md border border-border bg-card p-6">
        <h2 id="summary" className="font-display text-display-sm">
          Order summary
        </h2>
        {/* Every charge is listed before checkout: no drip pricing (Dark Patterns Guidelines, 2023). */}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(totals.subtotalPaise, { omitZeroPaise: true })}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{totals.shipping.chargedPaise === 0 ? "Free" : formatINR(totals.shipping.chargedPaise, { omitZeroPaise: true })}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatINR(totals.grandTotalPaise, { omitZeroPaise: true })}</dd>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <dt>Includes GST</dt>
            <dd>{formatINR(totals.gst.taxPaise, { omitZeroPaise: true })}</dd>
          </div>
        </dl>
        {toFree !== null && toFree > 0 && (
          <p className="text-sm text-muted-foreground">
            Add {formatINR(toFree, { omitZeroPaise: true })} more for free shipping.
          </p>
        )}
        <ul className="space-y-1 text-xs text-muted-foreground">
          {settings.prepaidIncentive.type !== "none" && settings.prepaidIncentive.message && (
            <li>{settings.prepaidIncentive.message} (applied at checkout).</li>
          )}
          <li>
            Cash on delivery on orders up to {formatINR(settings.codMaxOrderPaise, { omitZeroPaise: true })}, with a{" "}
            {formatINR(settings.codFeePaise, { omitZeroPaise: true })} fee.
          </li>
          <li>One-of-a-kind pieces are held for 15 minutes once you start checkout.</li>
        </ul>
        <Link href={routes.checkout} className={buttonVariants({ size: "lg", className: "w-full" })}>
          Checkout
        </Link>
      </aside>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-8 font-display text-display-lg">Your bag</h1>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <CartContents />
      </Suspense>
    </div>
  );
}
