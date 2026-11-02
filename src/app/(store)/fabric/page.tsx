import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/fabric";

export function generateMetadata({ searchParams }: PageProps<"/fabric">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/fabric">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
