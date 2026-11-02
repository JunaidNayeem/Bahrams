"use client";

import { TruckIcon } from "lucide-react";
import { useActionState } from "react";

import { checkDelivery, type DeliveryCheckResult } from "@/app/(store)/products/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeliveryCheck({ madeToOrderLeadDays }: { madeToOrderLeadDays: number | null }) {
  const [result, action, pending] = useActionState<DeliveryCheckResult | null, FormData>(
    (_prev, form) => checkDelivery({ pincode: String(form.get("pincode") ?? ""), madeToOrderLeadDays }),
    null,
  );

  return (
    <form action={action} className="space-y-2 rounded-md border border-border p-4">
      <Label htmlFor="pincode" className="flex items-center gap-2">
        <TruckIcon className="size-4" aria-hidden /> Check delivery date
      </Label>
      <div className="flex gap-2">
        <Input
          id="pincode"
          name="pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[1-9][0-9]{5}"
          maxLength={6}
          placeholder="PIN code"
          required
          className="max-w-40"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Checking…" : "Check"}
        </Button>
      </div>
      <div aria-live="polite" className="text-sm">
        {result?.ok === false && <p className="text-destructive">{result.message}</p>}
        {result?.ok && (
          <div className="space-y-1">
            <p>
              Delivery to {result.place ?? result.pincode} by <strong>{result.window}</strong>
              {result.madeToOrder ? ", including weaving time" : ""}.
            </p>
            <p className="text-muted-foreground">{result.cod}</p>
          </div>
        )}
      </div>
    </form>
  );
}
