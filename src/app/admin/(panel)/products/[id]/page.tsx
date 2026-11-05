import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductEditor } from "@/components/admin/product-editor";
import { PageHeader, PublishStatusPill } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls, productUrl } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { getAdminProduct, listWeaverOptions } from "@/lib/data/admin/products";
import { productMediaUrl } from "@/lib/data/media";

import { toEditorValues } from "../editor-values";

export const metadata = { title: "Edit product" };

async function Editor({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireStaff("owner", "manager", "catalogue_editor");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [product, weavers] = await Promise.all([getAdminProduct(id), listWeaverOptions()]);
  if (!product) notFound();

  // Each design's photos are shown and uploaded inside that design's row in the editor.
  const photos = [...product.product_media]
    .filter((m) => m.kind === "image")
    .sort((a, b) => a.sort - b.sort)
    .map((m) => ({
      id: m.id,
      url: productMediaUrl(m.storage_path),
      alt: m.alt,
      variantId: m.variant_id,
    }));

  return (
    <>
      <PageHeader
        title={product.title}
        description={<PublishStatusPill status={product.status} />}
        back={{ href: adminUrls.products, label: "Products" }}
        actions={
          product.status === "published" ? (
            <Link
              href={productUrl(product.slug)}
              target="_blank"
              className={buttonVariants({ variant: "outline" })}
            >
              View in store <ExternalLinkIcon />
            </Link>
          ) : undefined
        }
      />
      {/* key resets the uncontrolled form after a save brings back fresh data. */}
      <ProductEditor
        key={product.updated_at}
        initial={toEditorValues(product)}
        weavers={weavers}
        photos={photos}
      />
    </>
  );
}

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={params} />
    </Suspense>
  );
}
