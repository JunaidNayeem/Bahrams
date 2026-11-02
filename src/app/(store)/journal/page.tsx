import { ComingSoon } from "@/components/store/coming-soon";
import { noindexMetadata } from "@/lib/seo/metadata";

export const metadata = noindexMetadata("Journal", "/journal");

export default function Page() {
  return (
    <ComingSoon title="Journal">
      <p>Weaver stories, draping guides and notes from the looms of Bhagalpur. The first stories are being written.</p>
    </ComingSoon>
  );
}
