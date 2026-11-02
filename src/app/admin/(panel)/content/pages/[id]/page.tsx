import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageEditorForm } from "@/components/admin/content-controls";
import { formatDateTime, PageHeader, Panel } from "@/components/admin/ui";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { htmlToMarkup } from "@/lib/cms/simple-markup";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit page" };

async function Editor({ params }: { params: PageProps<"/admin/content/pages/[id]">["params"] }) {
  await requireStaff("owner", "manager", "catalogue_editor");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("id, slug, kind, title, status, seo_title, seo_description, current_version_id, page_versions!page_versions_page_id_fkey ( id, version, title, body_html, effective_from, change_summary, created_at )")
    .eq("id", id)
    .maybeSingle();
  if (!page) notFound();
  const versions = [...page.page_versions].sort((a, b) => b.version - a.version);
  const current = versions.find((v) => v.id === page.current_version_id) ?? versions[0];

  return (
    <>
      <PageHeader
        title={page.title}
        description={`/${page.slug}`}
        back={{ href: adminUrls.content, label: "Content" }}
        actions={
          <Link href={`/${page.slug}`} target="_blank" className={buttonVariants({ variant: "outline" })}>
            View on site <ExternalLinkIcon />
          </Link>
        }
      />
      <PageEditorForm
        key={current?.id}
        id={page.id}
        kind={page.kind}
        initial={{
          title: current?.title ?? page.title,
          body: htmlToMarkup(current?.body_html ?? ""),
          seoTitle: page.seo_title ?? "",
          seoDescription: page.seo_description ?? "",
          status: page.status,
          effectiveFrom: current?.effective_from ?? "",
        }}
      />
      <Panel title="Version history" className="mt-6">
        <ol className="space-y-2 text-sm">
          {versions.map((v) => (
            <li key={v.id} className="flex flex-wrap gap-x-3">
              <span className="font-medium tabular-nums">v{v.version}</span>
              <span>{v.change_summary ?? "—"}</span>
              {v.effective_from && <span className="text-muted-foreground">effective {v.effective_from}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(v.created_at)}</span>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}

export default function EditPage({ params }: PageProps<"/admin/content/pages/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={params} />
    </Suspense>
  );
}
