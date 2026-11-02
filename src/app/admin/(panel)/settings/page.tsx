import { Suspense } from "react";

import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

const rupees = (paise: unknown, fallback = 0) => String((typeof paise === "number" ? paise : fallback) / 100);
const str = (v: unknown) => (typeof v === "string" ? v : "");

async function Settings() {
  const staff = await requireStaff("owner", "manager");
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value");
  const s = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;
  const entity = (s.legal_entity ?? {}) as Record<string, unknown>;
  const officer = (s.grievance_officer ?? {}) as Record<string, unknown>;
  const prepaid = (s.prepaid_incentive ?? {}) as Record<string, unknown>;

  return (
    <SettingsForm
      canEdit={staff.role === "owner" || staff.role === "manager"}
      values={{
        codMax: rupees(s.cod_max_order_paise, 500000),
        codFee: rupees(s.cod_fee_paise, 4900),
        freeShipping: rupees(s.free_shipping_threshold_paise, 250000),
        shippingFee: rupees(s.shipping_fee_paise, 9900),
        giftWrap: rupees(s.gift_wrap_paise, 9900),
        prepaidAmount: rupees(prepaid.amount_paise),
        prepaidMessage: str(prepaid.message),
        returnWindowDays: String(typeof s.return_window_days === "number" ? s.return_window_days : 7),
        entityName: str(entity.name),
        entityAddress: str(entity.address),
        entityGstin: str(entity.gstin),
        entityEmail: str(entity.email),
        entityPhone: str(entity.phone),
        officerName: str(officer.name),
        officerEmail: str(officer.email),
        officerPhone: str(officer.phone),
        officerHours: str(officer.hours),
      }}
    />
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Store-wide rules for payments, shipping and the legal details shown on the site." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Settings />
      </Suspense>
    </>
  );
}
