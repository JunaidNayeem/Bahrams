import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Your account", "/account");

export default function Page() {
  return (
    <ComingSoon title="Your account">
      <p>Orders, tracking, returns, wishlist and saved addresses will live here.</p>
    </ComingSoon>
  );
}
