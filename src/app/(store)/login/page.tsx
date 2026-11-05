import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Sign in", "/login");

export default function Page() {
  return (
    <ComingSoon title="Sign in">
      <p>
        Sign in with a one-time code sent to your email is coming soon. You can shop and check out
        as a guest.
      </p>
    </ComingSoon>
  );
}
