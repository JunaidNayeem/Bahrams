import { CollectionView, collectionPageMetadata } from "@/components/store/collection-view";

const PATH = "/dress-material";

export function generateMetadata({ searchParams }: PageProps<"/dress-material">) {
  return collectionPageMetadata(PATH, searchParams);
}

export default function Page({ searchParams }: PageProps<"/dress-material">) {
  return <CollectionView path={PATH} searchParams={searchParams} />;
}
