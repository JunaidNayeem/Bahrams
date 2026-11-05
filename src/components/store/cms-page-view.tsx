import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ZariDivider } from "@/components/brand/zari-divider";
import { JsonLd } from "@/components/seo/json-ld";
import { routes } from "@/config/routes";
import { CMS_MEDIA_CLASSES } from "@/lib/cms/media-classes";
import { getPage } from "@/lib/data/cms";
import { breadcrumbJsonLd, faqItemsFromHtml, faqPageJsonLd, webPageJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata, toPlainText } from "@/lib/seo/metadata";

export async function cmsPageMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? toPlainText(page.bodyHtml).slice(0, 300),
    path,
    noindex: page.noindex,
  });
}

/** CMS slugs map 1:1 to paths: "help/faq" is served at /help/faq. */
const pagePath = (slug: string) => `/${slug}`;

/** Renders a published CMS page (legal, help, craft) from its current version. */
export async function CmsPageView({ slug }: { slug: string }) {
  "use cache";
  const page = await getPage(slug);
  if (!page) notFound();
  const updated = new Date(page.updatedAt).toLocaleDateString("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  });
  const path = pagePath(slug);

  return (
    <article className="container-page max-w-3xl py-12">
      <JsonLd
        data={[
          webPageJsonLd({
            path,
            name: page.title,
            description: page.seoDescription ?? undefined,
            type: slug === "our-story" ? "AboutPage" : "WebPage",
            dateModified: new Date(page.updatedAt).toISOString(),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: routes.home },
            { name: page.title, path },
          ]),
          // The questions are the page's visible <h2>s, as Google requires for FAQPage.
          slug === "help/faq" ? faqPageJsonLd(faqItemsFromHtml(page.bodyHtml)) : null,
        ]}
      />
      <h1 className="font-display text-display-lg">{page.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {page.kind === "legal" && page.effectiveFrom
          ? `Effective from ${new Date(page.effectiveFrom).toLocaleDateString("en-IN", { dateStyle: "long" })} · version ${page.version}`
          : `Last updated ${updated}`}
      </p>
      <ZariDivider className="my-6 w-24" />
      {/* body_html is sanitised by the admin editor on save; only staff can write page_versions. */}
      <div
        className={`space-y-4 leading-relaxed [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-display-sm [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc ${CMS_MEDIA_CLASSES}`}
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
    </article>
  );
}
