import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/stoles-dupattas";

export function generateMetadata({ searchParams }: PageProps<"/stoles-dupattas">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/stoles-dupattas">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
