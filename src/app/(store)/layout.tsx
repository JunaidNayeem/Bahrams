import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { getStoreSettings } from "@/lib/data/settings";
import { formatINR } from "@/lib/domain/money";

async function announcement(): Promise<string | null> {
  "use cache";
  const settings = await getStoreSettings();
  const parts: string[] = [];
  if (settings.freeShippingThresholdPaise !== null) {
    parts.push(`Free shipping above ${formatINR(settings.freeShippingThresholdPaise, { omitZeroPaise: true })}`);
  }
  if (settings.prepaidIncentive.type !== "none" && settings.prepaidIncentive.message) {
    parts.push(settings.prepaidIncentive.message);
  }
  parts.push(`${settings.returnWindowDays}-day easy exchanges`);
  return parts.join(" · ");
}

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:shadow-card"
      >
        Skip to content
      </a>
      <SiteHeader announcement={await announcement()} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
