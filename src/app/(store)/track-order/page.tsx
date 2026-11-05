import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Track your order", "/track-order");

export default function Page() {
  return (
    <ComingSoon title="Track your order">
      <p>
        Order tracking by order number and phone is coming soon. Until then, message us on WhatsApp
        with your order number.
      </p>
    </ComingSoon>
  );
}
