import { Suspense } from "react";

import { CmsPageView, cmsPageMetadata } from "@/components/store/cms-page-view";
import { LEGAL_PAGES } from "@/config/routes";

type Props = PageProps<"/legal/[slug]">;

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return cmsPageMetadata(`legal/${slug}`, `/legal/${slug}`);
}

async function Content({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  return <CmsPageView slug={`legal/${slug}`} />;
}

export default function Page({ params }: Props) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}
