"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { saveSettings } from "@/app/admin/(panel)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export interface SettingsValues {
  codMax: string;
  codFee: string;
  freeShipping: string;
  shippingFee: string;
  giftWrap: string;
  prepaidAmount: string;
  prepaidMessage: string;
  returnWindowDays: string;
  entityName: string;
  entityAddress: string;
  entityGstin: string;
  entityEmail: string;
  entityPhone: string;
  officerName: string;
  officerEmail: string;
  officerPhone: string;
  officerHours: string;
}

function F({ name, label, value, hint, prefix }: { name: keyof SettingsValues; label: string; value: string; hint?: string; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input id={name} name={name} defaultValue={value} />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function SettingsForm({ values, canEdit }: { values: SettingsValues; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        start(async () => {
          const res = await saveSettings(data);
          toast({ title: res.ok ? "Saved" : "Not saved", description: res.message, variant: res.ok ? "default" : "destructive" });
          if (res.ok) router.refresh();
        });
      }}
      className="space-y-6"
    >
      <fieldset disabled={!canEdit || pending} className="space-y-6">
        <Group title="Cash on delivery" description="COD orders return far more often than prepaid ones; these limits protect margin.">
          <F name="codMax" label="COD only up to" prefix="₹" value={values.codMax} />
          <F name="codFee" label="COD fee (shown upfront)" prefix="₹" value={values.codFee} />
        </Group>
        <Group title="Shipping and extras">
          <F name="shippingFee" label="Shipping fee" prefix="₹" value={values.shippingFee} />
          <F name="freeShipping" label="Free shipping above" prefix="₹" value={values.freeShipping} />
          <F name="giftWrap" label="Gift wrap" prefix="₹" value={values.giftWrap} />
          <F name="returnWindowDays" label="Return / exchange window (days)" value={values.returnWindowDays} />
        </Group>
        <Group title="Prepaid incentive" description="A small saving for paying online. Set to 0 to switch it off.">
          <F name="prepaidAmount" label="Discount for prepaid orders" prefix="₹" value={values.prepaidAmount} />
          <F name="prepaidMessage" label="Message shown to shoppers" value={values.prepaidMessage} />
        </Group>
        <Group title="Seller details" description="Shown in the footer and on invoices, as the Consumer Protection (E-Commerce) Rules require.">
          <F name="entityName" label="Registered legal name" value={values.entityName} />
          <F name="entityGstin" label="GSTIN" value={values.entityGstin} />
          <F name="entityAddress" label="Registered address" value={values.entityAddress} />
          <F name="entityEmail" label="Contact email" value={values.entityEmail} />
          <F name="entityPhone" label="Contact phone" value={values.entityPhone} />
        </Group>
        <Group title="Grievance officer" description="Complaints are acknowledged within 48 hours and resolved within one month.">
          <F name="officerName" label="Name" value={values.officerName} />
          <F name="officerEmail" label="Email" value={values.officerEmail} />
          <F name="officerPhone" label="Phone" value={values.officerPhone} />
          <F name="officerHours" label="Hours" value={values.officerHours} />
        </Group>
      </fieldset>
      {canEdit ? (
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">Only the owner or a manager can change settings.</p>
      )}
    </form>
  );
}
