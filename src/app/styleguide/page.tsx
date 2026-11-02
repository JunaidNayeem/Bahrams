import type { Metadata } from "next";

import { StripeBand } from "@/components/brand/stripe-band";
import { Wordmark } from "@/components/brand/wordmark";

import { ActionsSection } from "./_components/actions-section";
import { BrandSection } from "./_components/brand-section";
import { DisplaySection } from "./_components/display-section";
import { ColourSection, SurfaceSection, TypographySection } from "./_components/foundations";
import { InputsSection } from "./_components/inputs-section";

export const metadata: Metadata = {
  title: "Styleguide",
  description: "Design tokens and components shared by the Bahram Silks storefront and admin.",
  robots: { index: false, follow: false },
};

const CONTENTS = [
  ["colour", "Colour"],
  ["type", "Typography"],
  ["surface", "Radius, shadow, width"],
  ["brand", "Brand"],
  ["inputs", "Form controls"],
  ["actions", "Actions and overlays"],
  ["display", "Data display"],
] as const;

export default function StyleguidePage() {
  return (
    <>
      <StripeBand size="xs" />
      <header className="container-page grid gap-4 py-10">
        <Wordmark layout="inline" size="sm" />
        <h1 className="font-display text-display-xl font-semibold">Design system</h1>
        <p className="max-w-prose text-muted-foreground">
          Tokens and components shared by the storefront and admin. Every colour pairing below is
          checked against WCAG 2.2 AA; tab through the page to review focus states.
        </p>
        <nav aria-label="Styleguide sections">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {CONTENTS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-primary underline-offset-4 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="container-page grid gap-16 pb-24">
        <ColourSection />
        <TypographySection />
        <SurfaceSection />
        <BrandSection />
        <InputsSection />
        <ActionsSection />
        <DisplaySection />
      </main>
    </>
  );
}
