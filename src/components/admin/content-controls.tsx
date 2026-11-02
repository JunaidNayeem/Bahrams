"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { moveHomeSection, renameHomeSection, savePage, toggleHomeSection, type ContentResult } from "@/app/admin/(panel)/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { markupToHtml } from "@/lib/cms/simple-markup";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ContentResult>) =>
    start(async () => {
      const res = await fn();
      toast({ title: res.ok ? "Saved" : "Not saved", description: res.message, variant: res.ok ? "default" : "destructive" });
      if (res.ok) router.refresh();
    });
  return { pending, run };
}

export function HomeSectionRow({
  id,
  type,
  title,
  active,
  first,
  last,
}: {
  id: string;
  type: string;
  title: string | null;
  active: boolean;
  first: boolean;
  last: boolean;
}) {
  const { pending, run } = useRun();
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="flex flex-col">
        <Button variant="ghost" size="icon-sm" aria-label="Move up" disabled={first || pending} onClick={() => run(() => moveHomeSection(id, -1))}>
          <ArrowUpIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Move down" disabled={last || pending} onClick={() => run(() => moveHomeSection(id, 1))}>
          <ArrowDownIcon />
        </Button>
      </div>
      <div className="min-w-48 flex-1">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{type.replace(/_/g, " ")}</p>
        <Input
          defaultValue={title ?? ""}
          aria-label={`Heading for ${type.replace(/_/g, " ")} section`}
          onBlur={(e) => e.target.value !== (title ?? "") && run(() => renameHomeSection(id, e.target.value))}
          className="mt-1 h-9"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Switch checked={active} disabled={pending} onCheckedChange={(v) => run(() => toggleHomeSection(id, v))} />
        {active ? "Shown" : "Hidden"}
      </label>
    </li>
  );
}

export function PageEditorForm({
  id,
  kind,
  initial,
}: {
  id: string;
  kind: string;
  initial: { title: string; body: string; seoTitle: string; seoDescription: string; status: string; effectiveFrom: string };
}) {
  const { pending, run } = useRun();
  const [body, setBody] = useState(initial.body);
  const [preview, setPreview] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        run(() => savePage(data));
      }}
      className="grid gap-6 xl:grid-cols-[1fr_20rem]"
    >
      <input type="hidden" name="id" value={id} />
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={initial.title} required />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="body">Content</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
              {preview ? "Edit" : "Preview"}
            </Button>
          </div>
          {preview ? (
            <div
              className="min-h-96 space-y-3 rounded-md border border-border p-4 text-sm leading-relaxed [&_a]:underline [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
              // markupToHtml escapes everything; only its own tags are produced.
              dangerouslySetInnerHTML={{ __html: markupToHtml(body) }}
            />
          ) : (
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={22} className="min-h-96 font-mono text-sm" />
          )}
          <input type="hidden" name="body" value={body} />
          <p className="text-xs text-muted-foreground">
            <code>## Heading</code> · <code>### Subheading</code> · <code>- bullet</code> · <code>1. numbered</code> · <code>**bold**</code> ·{" "}
            <code>[link](/path)</code> · blank line = new paragraph
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" defaultValue={initial.status} className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {kind === "legal" && (
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom">Effective from</Label>
              <Input id="effectiveFrom" name="effectiveFrom" type="date" defaultValue={initial.effectiveFrom} />
            </div>
          )}
          {kind !== "legal" && <input type="hidden" name="effectiveFrom" value="" />}
          <div className="space-y-1.5">
            <Label htmlFor="changeSummary">What changed {kind === "legal" ? "(required)" : "(optional)"}</Label>
            <Input id="changeSummary" name="changeSummary" placeholder="e.g. Updated return window wording" />
          </div>
        </div>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="seoTitle">SEO title</Label>
            <Input id="seoTitle" name="seoTitle" defaultValue={initial.seoTitle} maxLength={70} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seoDescription">Meta description</Label>
            <Textarea id="seoDescription" name="seoDescription" defaultValue={initial.seoDescription} maxLength={170} rows={3} />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Save new version"}
        </Button>
      </div>
    </form>
  );
}
