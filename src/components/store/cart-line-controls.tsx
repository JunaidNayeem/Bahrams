"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { removeCartLine, updateCartLine } from "@/app/(store)/cart/actions";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { toast } from "@/components/ui/use-toast";

interface Props {
  variantId: string;
  title: string;
  sellUnit: "piece" | "metre";
  quantity: number;
  minQty: number;
  maxQty: number;
  fixedQuantity: boolean;
}

export function CartLineControls({
  variantId,
  title,
  sellUnit,
  quantity,
  minQty,
  maxQty,
  fixedQuantity,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok)
        toast({
          title: "Couldn't update your bag",
          description: result.message,
          variant: "destructive",
        });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3" aria-busy={pending}>
      {!fixedQuantity && (
        <QuantityStepper
          label={`Quantity of ${title}`}
          unit={sellUnit}
          step={sellUnit === "metre" ? 0.5 : 1}
          min={minQty}
          max={Math.max(minQty, maxQty)}
          value={quantity}
          disabled={pending}
          onValueChange={(q) => run(() => updateCartLine({ variantId, quantity: q }))}
        />
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => run(() => removeCartLine(variantId))}
        aria-label={`Remove ${title}`}
      >
        <Trash2Icon /> Remove
      </Button>
    </div>
  );
}
