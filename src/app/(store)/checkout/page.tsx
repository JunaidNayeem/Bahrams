import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Checkout", "/checkout");

export default function Page() {
  return (
    <ComingSoon title="Checkout">
      <p>
        Secure checkout with UPI, cards, netbanking and cash on delivery is being built next. Your
        bag is saved.
      </p>
      <p>Payments run in Razorpay test mode until the store goes live.</p>
    </ComingSoon>
  );
}
