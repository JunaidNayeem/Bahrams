import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/kurta-fabric";

export function generateMetadata({ searchParams }: PageProps<"/kurta-fabric">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/kurta-fabric">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
