import { Suspense } from "react";

import { PageHeader } from "@/components/admin/ui";
import { ProductEditor } from "@/components/admin/product-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { listWeaverOptions } from "@/lib/data/admin/products";

import { emptyEditorValues } from "../editor-values";

export const metadata = { title: "New product" };

async function Editor() {
  await requireStaff("owner", "manager", "catalogue_editor");
  const weavers = await listWeaverOptions();
  return (
    <ProductEditor
      initial={emptyEditorValues()}
      weavers={weavers}
      aside={<p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Save the product first, then add photos.</p>}
    />
  );
}

export default function NewProductPage() {
  return (
    <>
      <PageHeader title="New product" back={{ href: adminUrls.products, label: "Products" }} />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Editor />
      </Suspense>
    </>
  );
}
