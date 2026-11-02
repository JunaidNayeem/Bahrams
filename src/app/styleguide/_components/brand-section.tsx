import { ClaimBadge } from "@/components/brand/claim-badge";
import { Monogram } from "@/components/brand/monogram";
import { ProofStrip, WHY_BAHRAM_PROOF_ITEMS } from "@/components/brand/proof-strip";
import { SectionHeading } from "@/components/brand/section-heading";
import { StripeBand } from "@/components/brand/stripe-band";
import { ZariDivider } from "@/components/brand/zari-divider";
import { Wordmark } from "@/components/brand/wordmark";

import { Specimen, StyleguideSection } from "./specimen";

export function BrandSection() {
  return (
    <StyleguideSection id="brand" title="Brand">
      <Specimen
        title="Wordmark and monogram"
        note="Typographic placeholders until a logo concept is commissioned."
      >
        <div className="flex flex-wrap items-end gap-10">
          <Wordmark size="lg" />
          <Wordmark layout="inline" tone="primary" />
          <Monogram size={56} />
          <Monogram size={32} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-10 rounded-md bg-charcoal-900 p-6">
          <Wordmark tone="inverse" />
          <Wordmark tone="inverse" layout="inline" size="sm" />
        </div>
      </Specimen>
      <Specimen
        title="Zari divider"
        note="Section divider. Decorative unless `decorative={false}`."
      >
        <div className="grid gap-6">
          <ZariDivider />
          <ZariDivider ornament={false} />
          <ZariDivider tone="madder" className="mx-auto w-48" />
        </div>
      </Specimen>
      <Specimen
        title="Stripe band"
        note="Bhagalpuri stripes and checks. Borders and edges only: it accepts no children, so text can never sit on it."
      >
        <div className="grid gap-4">
          <StripeBand />
          <StripeBand colorway="indigo" size="xs" />
          <StripeBand colorway="tussar" size="md" />
          <StripeBand pattern="check" colorway="leaf" size="lg" />
          <StripeBand pattern="check" colorway="madder" size="lg" />
        </div>
      </Specimen>
      <Specimen title="Section heading">
        <div className="grid gap-10">
          <SectionHeading
            eyebrow="The craft"
            title="Silk types explained"
            description="Tussar is a wild silk with a natural gold hue. Ghicha is drawn by hand from tussar cocoons; matka is hand-spun from mulberry cocoon waste."
            divider
          />
          <SectionHeading
            as="h3"
            align="center"
            eyebrow="New arrivals"
            title="Fresh from the looms"
            divider
          />
        </div>
      </Specimen>
      <Specimen
        title="Claim badges"
        note="Display only. Render one only after src/lib/domain/claims confirms the record."
      >
        <div className="flex flex-wrap gap-2">
          <ClaimBadge claim="silk_mark" label="Silk Mark" detail="Label no. shown here" />
          <ClaimBadge claim="pure_silk" label="Pure silk" />
          <ClaimBadge claim="gi_bhagalpur" label="Bhagalpur Silk (GI)" />
          <ClaimBadge claim="handloom" label="Handloom" />
          <ClaimBadge claim="handloom_mark" label="Handloom Mark" size="sm" />
        </div>
      </Specimen>
      <Specimen title="Proof strip" className="p-0 sm:p-0">
        <ProofStrip items={WHY_BAHRAM_PROOF_ITEMS} contained={false} className="px-4 sm:px-6" />
        <ProofStrip
          items={WHY_BAHRAM_PROOF_ITEMS}
          compact
          contained={false}
          label="Why Bahram Silks (compact)"
          className="border-b-0 px-4 sm:px-6"
        />
      </Specimen>
    </StyleguideSection>
  );
}
