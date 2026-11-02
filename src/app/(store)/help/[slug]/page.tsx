import { Suspense } from "react";

import { CmsPageView, cmsPageMetadata } from "@/components/store/cms-page-view";
import { HELP_PAGES } from "@/config/routes";

type Props = PageProps<"/help/[slug]">;

export function generateStaticParams() {
  return HELP_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return cmsPageMetadata(`help/${slug}`, `/help/${slug}`);
}

async function Content({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  return <CmsPageView slug={`help/${slug}`} />;
}

export default function Page({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
