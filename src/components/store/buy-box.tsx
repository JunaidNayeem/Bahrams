"use client";

import { MessageCircleIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import { addToCart } from "@/app/(store)/cart/actions";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { toast } from "@/components/ui/use-toast";
import { routes } from "@/config/routes";
import type { Variant } from "@/lib/data/product";
import { formatINR } from "@/lib/domain/money";
import { variantChoiceKind, variantLabel, variantPath } from "@/lib/domain/variants";
import { cn } from "@/lib/utils";

import { useVariantSelection } from "./variant-selection";

interface BuyBoxProps {
  productTitle: string;
  productUrl: string;
  isOneOfAKind: boolean;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  variants: Variant[];
  availability: Record<string, number>;
  /** First photo of each design that has its own, keyed by variant id (picker thumbnails). */
  variantThumbs: Record<string, string>;
  whatsappNumber: string;
}

export function BuyBox({
  productTitle,
  productUrl,
  isOneOfAKind,
  madeToOrder,
  leadTimeDays,
  variants,
  availability,
  variantThumbs,
  whatsappNumber,
}: BuyBoxProps) {
  const selection = useVariantSelection();
  const [localId, setLocalId] = useState(variants[0]?.id);
  const variantId = selection?.selectedId ?? localId;
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const [quantity, setQuantity] = useState(variant?.minQty ?? 1);
  // A design chosen from the URL (?variant=) arrives after the first render: reset its quantity.
  const [quantityFor, setQuantityFor] = useState(variant?.id);
  const [pending, startTransition] = useTransition();
  if (!variant) return null;
  if (quantityFor !== variant.id) {
    setQuantityFor(variant.id);
    setQuantity(variant.minQty);
  }

  const choose = (v: Variant) => {
    (selection?.select ?? setLocalId)(v.id);
    setQuantityFor(v.id);
    setQuantity(v.minQty);
  };
  const choiceKind = variantChoiceKind(variants);
  const withThumbs = variants.some((v) => variantThumbs[v.id]);

  const metre = variant.sellUnit === "metre";
  const available = availability[variant.id] ?? 0;
  const inStock = available >= variant.minQty;
  const maxQty = Math.max(
    variant.minQty,
    Math.min(
      variant.maxQty ?? Infinity,
      metre ? Math.floor(available * 2) / 2 : Math.floor(available),
      metre ? 100 : 10,
    ),
  );
  const tier = [...variant.tiers].reverse().find((t) => quantity >= t.minQty);
  const unitPrice = tier?.pricePaise ?? variant.pricePaise;

  const variantUrl = variants.length > 1 ? variantPath(productUrl, variant.sku) : productUrl;
  const designText = variants.length > 1 ? `, ${variantLabel(variant)}` : "";
  const whatsappText = encodeURIComponent(
    `Hello Bahram Silks, I'd like to know more about "${productTitle}"${designText} (${variant.sku}): ${variantUrl}`,
  );

  function add() {
    startTransition(async () => {
      const result = await addToCart({ variantId: variant.id, quantity });
      toast({
        title: result.ok ? "Added to your bag" : "Couldn't add to bag",
        description: result.ok ? (
          <span>
            {result.message}{" "}
            <Link href={routes.cart} className="underline">
              View bag
            </Link>
          </span>
        ) : (
          result.message
        ),
        variant: result.ok ? "default" : "destructive",
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Price
          pricePaise={unitPrice}
          priorPricePaise={
            variant.discount.showCompareAt && !tier
              ? (variant.discount.compareAtPaise ?? undefined)
              : undefined
          }
          unit={variant.sellUnit}
          size="xl"
        />
        {variant.discount.showCompareAt && !tier && (
          <p className="text-sm text-success">
            You save {formatINR(variant.discount.savingPaise, { omitZeroPaise: true })} (
            {variant.discount.discountPercent}%). The struck-through price is what this piece
            actually sold for in the last 90 days.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Inclusive of GST. Shipping and any COD fee are shown before you pay.
        </p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            {choiceKind === "design" ? "Design" : "Colour"}:{" "}
            <span className="font-normal">{variantLabel(variant)}</span>
          </legend>
          {withThumbs ? (
            // Designs are told apart by their photo, so each choice shows it.
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {variants.map((v) => {
                const sold = (availability[v.id] ?? 0) < v.minQty;
                const thumb = variantThumbs[v.id];
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => choose(v)}
                    aria-pressed={v.id === variant.id}
                    aria-label={`${variantLabel(v)}${sold ? ", sold" : ""}`}
                    className={cn(
                      "group overflow-hidden rounded-md border text-left text-xs",
                      v.id === variant.id
                        ? "border-foreground ring-1 ring-foreground"
                        : "border-border hover:border-charcoal-500",
                    )}
                  >
                    <span className="relative block aspect-[4/5] bg-muted">
                      {thumb && (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          sizes="120px"
                          className={cn("object-cover", sold && "opacity-50")}
                        />
                      )}
                      {sold && (
                        <span className="absolute inset-x-0 bottom-0 bg-background/85 py-0.5 text-center font-medium">
                          {isOneOfAKind ? "Sold" : "Out of stock"}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5 px-2 py-1.5">
                      {v.colourHex && (
                        <span
                          className="size-3 shrink-0 rounded-full border border-black/10"
                          style={{ background: v.colourHex }}
                          aria-hidden
                        />
                      )}
                      <span className="line-clamp-2">{v.title ?? v.colour ?? v.sku}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => choose(v)}
                  aria-pressed={v.id === variant.id}
                  className={cn(
                    "flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm",
                    v.id === variant.id
                      ? "border-foreground ring-1 ring-foreground"
                      : "border-border hover:border-charcoal-500",
                  )}
                >
                  {v.colourHex && (
                    <span
                      className="size-4 rounded-full border border-black/10"
                      style={{ background: v.colourHex }}
                      aria-hidden
                    />
                  )}
                  {variantLabel(v)}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {metre && variant.tiers.length > 0 && (
        <table className="w-full text-sm">
          <caption className="mb-1 text-left font-medium">
            Bulk prices for boutiques and tailors
          </caption>
          <tbody>
            {variant.tiers.map((t) => (
              <tr
                key={t.minQty}
                className={cn(
                  "border-b border-border",
                  tier?.minQty === t.minQty && "font-semibold",
                )}
              >
                <td className="py-1">{t.minQty} m or more</td>
                <td className="py-1 text-right">
                  <Price pricePaise={t.pricePaise} unit="metre" size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {inStock && !isOneOfAKind && (
        <QuantityStepper
          label={metre ? "Length in metres" : "Quantity"}
          showLabel
          unit={variant.sellUnit}
          step={metre ? 0.5 : 1}
          min={variant.minQty}
          max={maxQty}
          value={quantity}
          onValueChange={setQuantity}
        />
      )}

      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled={!inStock || pending} onClick={add}>
          {!inStock ? (isOneOfAKind ? "Sold" : "Out of stock") : pending ? "Adding…" : "Add to bag"}
        </Button>
        {isOneOfAKind && inStock && (
          <p className="text-sm text-muted-foreground">
            One of a kind — there is only this piece. It is held for you for 15 minutes once you
            start checkout.
          </p>
        )}
        {madeToOrder && (
          <p className="text-sm text-muted-foreground">
            Made to order: woven for you in about {leadTimeDays} days before dispatch.
          </p>
        )}
        <a
          href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
          target="_blank"
          rel="noopener"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium hover:bg-accent"
        >
          <MessageCircleIcon className="size-4" /> Ask about this piece on WhatsApp
        </a>
      </div>
    </div>
  );
}
