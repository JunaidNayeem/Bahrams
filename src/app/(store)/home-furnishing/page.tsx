import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/home-furnishing";

export function generateMetadata({ searchParams }: PageProps<"/home-furnishing">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/home-furnishing">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
