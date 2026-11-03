import { BrandLoader } from "@/components/brand/brand-loader";

/** Shown between the header and footer while a storefront page streams in. */
export default function Loading() {
  return <BrandLoader className="min-h-[50vh]" />;
}
