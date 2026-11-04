import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ZariDivider } from "@/components/brand/zari-divider";
import { routes } from "@/config/routes";
import { getWeaver, listWeavers } from "@/lib/data/cms";
import { fibreLabel } from "@/lib/domain/claims";
import type { Fibre } from "@/lib/domain/enums";
import { buildMetadata } from "@/lib/seo/metadata";
import { slugParamsOrPlaceholder } from "@/lib/static-params";

type Props = PageProps<"/weavers/[slug]">;

export async function generateStaticParams() {
  return slugParamsOrPlaceholder((await listWeavers()).map((w) => w.slug));
}

export async function generateMetadata({ params }: Props) {
  const weaver = await getWeaver((await params).slug);
  if (!weaver) return {};
  return buildMetadata({
    title: `${weaver.name}, weaver in ${weaver.locality ?? "Bhagalpur"}`,
    description: weaver.bio ?? `${weaver.name} weaves for Bahram Silks in Bhagalpur.`,
    path: `/weavers/${weaver.slug}`,
    // Sample profiles exist only in development data and must never be indexed.
    noindex: weaver.isSample,
  });
}

async function Weaver({ params }: { params: Props["params"] }) {
  const weaver = await getWeaver((await params).slug);
  if (!weaver) notFound();
  return (
    <article className="container-page max-w-3xl py-12">
      <Link href={routes.weavers} className="text-sm text-muted-foreground hover:underline">
        ← All weavers
      </Link>
      <h1 className="mt-4 font-display text-display-lg">{weaver.name}</h1>
      <p className="text-muted-foreground">
        {weaver.locality ? `${weaver.locality}, Bhagalpur` : "Bhagalpur"}
        {weaver.yearsWeaving ? ` · ${weaver.yearsWeaving} years at the loom` : ""}
      </p>
      {weaver.isSample && (
        <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm">
          This is a sample profile in development data. Real weavers are named only with their
          consent.
        </p>
      )}
      <ZariDivider className="my-6 w-24" />
      {weaver.bio && <p className="leading-relaxed">{weaver.bio}</p>}
      {weaver.specialities.length > 0 && (
        <p className="mt-6 text-sm">
          <span className="font-medium">Weaves:</span>{" "}
          {weaver.specialities.map((s) => fibreLabel(s as Fibre)).join(", ")}
        </p>
      )}
    </article>
  );
}

export default function WeaverPage({ params }: Props) {
  return (
    <Suspense>
      <Weaver params={params} />
    </Suspense>
  );
}
