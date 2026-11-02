import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { HomeSectionRow } from "@/components/admin/content-controls";
import { formatDate, PageHeader, Panel, PublishStatusPill, tableCls } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { adminUrls } from "@/config/routes";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Content" };

const KIND: Record<string, string> = { legal: "Legal", help: "Help", craft: "Our story & craft" };

async function Content() {
  await requireStaff("owner", "manager", "catalogue_editor");
  const supabase = await createClient();
  const [{ data: pages }, { data: sections }] = await Promise.all([
    supabase
      .from("pages")
      .select("id, slug, kind, title, status, updated_at, page_versions!pages_current_version_fk ( version )")
      .order("kind")
      .order("title"),
    supabase.from("home_sections").select("id, type, title, active, position").order("position"),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
      <Panel title="Pages">
        <div className="-m-5 overflow-x-auto">
          <table className={tableCls.table}>
            <thead className={tableCls.thead}>
              <tr>
                <th className={tableCls.th}>Page</th>
                <th className={tableCls.th}>Type</th>
                <th className={tableCls.th}>Status</th>
                <th className={tableCls.th}>Version</th>
                <th className={tableCls.th}>Updated</th>
                <th className={tableCls.th}>
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(pages ?? []).map((p) => (
                <tr key={p.id} className={tableCls.tr}>
                  <td className={tableCls.td}>
                    <Link href={`${adminUrls.content}/pages/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className={tableCls.td}>{KIND[p.kind] ?? p.kind}</td>
                  <td className={tableCls.td}>
                    <PublishStatusPill status={p.status} />
                  </td>
                  <td className={`${tableCls.td} tabular-nums`}>v{p.page_versions?.version ?? "—"}</td>
                  <td className={`${tableCls.td} text-muted-foreground`}>{formatDate(p.updated_at)}</td>
                  <td className={tableCls.td}>
                    <Link href={`/${p.slug}`} target="_blank" aria-label={`View ${p.title}`} className="text-muted-foreground hover:text-foreground">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Home page sections">
        <p className="mb-2 text-xs text-muted-foreground">Reorder, rename or hide sections. Changes show on the home page immediately.</p>
        <ul className="divide-y divide-border">
          {(sections ?? []).map((s, i, all) => (
            <HomeSectionRow key={s.id} id={s.id} type={s.type} title={s.title} active={s.active} first={i === 0} last={i === all.length - 1} />
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export default function ContentPage() {
  return (
    <>
      <PageHeader title="Content" description="Legal and help pages, Our story, and the home page layout." />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content />
      </Suspense>
    </>
  );
}
