import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Bulk and boutique enquiries", "/bulk-enquiries");

export default function Page() {
  return (
    <ComingSoon title="Bulk and boutique enquiries">
      <p>Boutiques, tailors and designers: fabric by the metre at bulk prices, swatch orders and B2B quotes with GST invoices. The enquiry form is coming soon — message us on WhatsApp meanwhile.</p>
    </ComingSoon>
  );
}
