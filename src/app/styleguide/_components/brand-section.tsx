import Image from "next/image";

import { BrandLoader } from "@/components/brand/brand-loader";
import { BrandMark } from "@/components/brand/brand-mark";
import { ClaimBadge } from "@/components/brand/claim-badge";
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
        title="Logo: Peepal on the Ganga"
        note="Peepal leaf with zari veins above and a woven Ganga below. Below 40px the mark switches to the simplified favicon drawing. Master files in /public/brand; usage in docs/brand/logo.md."
      >
        <div className="flex flex-wrap items-end gap-10">
          <Image
            src="/brand/logo-primary.svg"
            alt="Bahram Silks primary logo"
            width={240}
            height={210}
            unoptimized
          />
          <Image
            src="/brand/logo-horizontal.svg"
            alt="Bahram Silks horizontal logo"
            width={294}
            height={112}
            unoptimized
          />
          <BrandMark size={96} />
          <BrandMark size={48} />
          <BrandMark size={32} />
          <BrandMark size={16} />
          <BrandMark size={72} tone="mono" />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-10 rounded-md bg-madder-800 p-6">
          <BrandMark size={72} tone="reversed" />
          <Wordmark tone="inverse" />
          <Wordmark tone="inverse" layout="inline" size="sm" />
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-10">
          <Wordmark size="lg" />
          <Wordmark layout="inline" tone="primary" />
        </div>
      </Specimen>
      <Specimen
        title="Loader"
        note="Weft threads woven across the leaf; static when reduced motion is on."
      >
        <BrandLoader />
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
