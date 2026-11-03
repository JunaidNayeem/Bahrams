import { BrandLoader } from "@/components/brand/brand-loader";

/** Shown in the content area, beside the admin navigation, while a panel page loads. */
export default function Loading() {
  return <BrandLoader size={56} className="min-h-[60vh]" />;
}
