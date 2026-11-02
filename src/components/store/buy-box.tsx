"use client";

import { MessageCircleIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface BuyBoxProps {
  productTitle: string;
  productUrl: string;
  isOneOfAKind: boolean;
  madeToOrder: boolean;
  leadTimeDays: number | null;
  variants: Variant[];
  availability: Record<string, number>;
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
  whatsappNumber,
}: BuyBoxProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const [quantity, setQuantity] = useState(variant?.minQty ?? 1);
  const [pending, startTransition] = useTransition();
  if (!variant) return null;

  const metre = variant.sellUnit === "metre";
  const available = availability[variant.id] ?? 0;
  const inStock = available >= variant.minQty;
  const maxQty = Math.max(
    variant.minQty,
    Math.min(variant.maxQty ?? Infinity, metre ? Math.floor(available * 2) / 2 : Math.floor(available), metre ? 100 : 10),
  );
  const tier = [...variant.tiers].reverse().find((t) => quantity >= t.minQty);
  const unitPrice = tier?.pricePaise ?? variant.pricePaise;

  const whatsappText = encodeURIComponent(`Hello Bahram Silks, I'd like to know more about "${productTitle}" (${variant.sku}): ${productUrl}`);

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
          priorPricePaise={variant.discount.showCompareAt && !tier ? (variant.discount.compareAtPaise ?? undefined) : undefined}
          unit={variant.sellUnit}
          size="xl"
        />
        {variant.discount.showCompareAt && !tier && (
          <p className="text-sm text-success">
            You save {formatINR(variant.discount.savingPaise, { omitZeroPaise: true })} ({variant.discount.discountPercent}%).
            The struck-through price is what this piece actually sold for in the last 90 days.
          </p>
        )}
        <p className="text-xs text-muted-foreground">Inclusive of GST. Shipping and any COD fee are shown before you pay.</p>
      </div>

      {variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Colour: <span className="font-normal">{variant.colour ?? variant.title}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVariantId(v.id);
                  setQuantity(v.minQty);
                }}
                aria-pressed={v.id === variant.id}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm",
                  v.id === variant.id ? "border-foreground ring-1 ring-foreground" : "border-border hover:border-charcoal-500",
                )}
              >
                {v.colourHex && <span className="size-4 rounded-full border border-black/10" style={{ background: v.colourHex }} aria-hidden />}
                {v.colour ?? v.title ?? v.sku}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {metre && variant.tiers.length > 0 && (
        <table className="w-full text-sm">
          <caption className="mb-1 text-left font-medium">Bulk prices for boutiques and tailors</caption>
          <tbody>
            {variant.tiers.map((t) => (
              <tr key={t.minQty} className={cn("border-b border-border", tier?.minQty === t.minQty && "font-semibold")}>
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
            One of a kind — there is only this piece. It is held for you for 15 minutes once you start checkout.
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
