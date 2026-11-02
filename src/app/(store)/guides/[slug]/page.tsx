import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ComingSoon } from "@/components/store/coming-soon";
import { GUIDES, isGuideSlug } from "@/config/routes";
import { noindexMetadata } from "@/lib/seo/metadata";

type Props = PageProps<"/guides/[slug]">;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

// Pillar guides are written in the content workstream (week 8+); noindex until they are.
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  return guide ? noindexMetadata(guide.title, `/guides/${slug}`) : {};
}

async function Guide({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  if (!isGuideSlug(slug)) notFound();
  const guide = GUIDES.find((g) => g.slug === slug)!;
  return (
    <ComingSoon title={guide.title}>
      <p>This guide is being written with original photographs from our looms in Bhagalpur.</p>
    </ComingSoon>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense>
      <Guide params={params} />
    </Suspense>
  );
}
