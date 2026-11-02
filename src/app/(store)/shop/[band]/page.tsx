import { Suspense } from "react";

import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";
import { PRICE_BANDS } from "@/config/routes";

type Props = PageProps<"/shop/[band]">;

export function generateStaticParams() {
  return PRICE_BANDS.map((b) => ({ band: b.slug }));
}

async function pathOf(params: Props["params"]) {
  return `/shop/${(await params).band}`;
}

export async function generateMetadata({ params, searchParams }: Props) {
  return collectionPageMetadata(await pathOf(params), searchParams);
}

async function Content({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  return <CollectionView path={await pathOf(params)} searchParams={searchParams} />;
}

// params is read inside <Suspense> so the route shell can render before the segment resolves.
export default function Page({ params, searchParams }: Props) {
  return (
    <Suspense>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}
