import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CmsPageView, cmsPageMetadata } from "@/components/store/cms-page-view";
import { ComingSoon } from "@/components/store/coming-soon";
import { GUIDES, guideUrl, isGuideSlug } from "@/config/routes";
import { getPage } from "@/lib/data/cms";
import { noindexMetadata } from "@/lib/seo/metadata";

type Props = PageProps<"/guides/[slug]">;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

// A guide is a CMS page at "guides/<slug>"; until one is published the route stays noindex.
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return {};
  const path = guideUrl(guide.slug);
  return (await getPage(`guides/${slug}`))
    ? cmsPageMetadata(`guides/${slug}`, path)
    : noindexMetadata(guide.title, path);
}

async function Guide({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  if (!isGuideSlug(slug)) notFound();
  if (await getPage(`guides/${slug}`)) return <CmsPageView slug={`guides/${slug}`} />;
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
