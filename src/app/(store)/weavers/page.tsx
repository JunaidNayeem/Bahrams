import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { routes, weaverUrl } from "@/config/routes";
import { listWeavers } from "@/lib/data/cms";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Our weavers",
  description:
    "Meet the Bhagalpur weavers behind Bahram Silks — the hands at the looms in Nathnagar, Champanagar and beyond, credited by name wherever they agree.",
  path: "/weavers",
});

export default async function WeaversPage() {
  "use cache";
  const weavers = await listWeavers();
  return (
    <div className="container-page py-12">
      <JsonLd
        data={[
          webPageJsonLd({ path: routes.weavers, name: "Our weavers", type: "CollectionPage" }),
          breadcrumbJsonLd([
            { name: "Home", path: routes.home },
            { name: "Our weavers", path: routes.weavers },
          ]),
        ]}
      />
      <SectionHeading
        as="h1"
        title="Our weavers"
        description="Bhagalpur, the Silk City, has some 30,000 handloom weavers on around 25,000 looms. These are the people whose work you wear."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {weavers.map((w) => (
          <li key={w.slug} className="rounded-md border border-border bg-card p-6">
            <Link href={weaverUrl(w.slug)} className="font-display text-2xl hover:underline">
              {w.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {w.locality}
              {w.yearsWeaving ? ` · ${w.yearsWeaving} years at the loom` : ""}
            </p>
            {w.bio && <p className="mt-3 line-clamp-4 text-sm">{w.bio}</p>}
            {w.isSample && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                Sample profile for development
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
