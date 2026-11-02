import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { productMediaUrl } from "@/lib/data/media";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Media library" };

async function Media() {
  await requireStaff("owner", "manager", "catalogue_editor");
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_media")
    .select("id, storage_path, alt, kind, width, height, created_at, products ( id, title )")
    .eq("kind", "image")
    .order("created_at", { ascending: false });
  const missingAlt = (data ?? []).filter((m) => !m.alt.trim()).length;

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        {data?.length ?? 0} photos · {missingAlt === 0 ? "every photo has alt text" : `${missingAlt} missing alt text`}
      </p>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {(data ?? []).map((m) => (
          <li key={m.id} className="space-y-1">
            <Link href={m.products ? adminUrls.product(m.products.id) : "#"} className="relative block aspect-[4/5] overflow-hidden rounded-md bg-muted">
              <Image src={productMediaUrl(m.storage_path)} alt={m.alt} fill sizes="200px" className="object-cover" />
            </Link>
            <p className="truncate text-xs font-medium">{m.products?.title}</p>
            <p className="truncate text-xs text-muted-foreground">{m.width && m.height ? `${m.width}×${m.height}` : "WebP"}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Media library" description="All product photos. Upload and reorder them on each product; uploads are converted to WebP." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Media />
      </Suspense>
    </>
  );
}
