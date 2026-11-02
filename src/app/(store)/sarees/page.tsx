import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/sarees";

export function generateMetadata({ searchParams }: PageProps<"/sarees">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/sarees">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
