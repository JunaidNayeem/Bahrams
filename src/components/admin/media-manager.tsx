"use client";

import { ArrowDownIcon, ArrowUpIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { deleteMedia, moveMedia, updateMediaAlt, uploadProductImages } from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export interface MediaItem {
  id: string;
  url: string;
  alt: string;
}

export function MediaManager({ productId, items }: { productId: string; items: MediaItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append("files", f);
    start(async () => {
      const res = await uploadProductImages(productId, form);
      toast({ title: res.ok ? "Photos added" : "Upload failed", description: res.message, variant: res.ok ? "default" : "destructive" });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card" aria-busy={pending}>
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold">Photos</h2>
          <p className="text-xs text-muted-foreground">First photo is the main image. Daylight, true colour, 6–8 per piece.</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => fileRef.current?.click()}>
          <ImagePlusIcon /> {pending ? "Working…" : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      {items.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">No photos yet. Uploads are converted to WebP and stripped of location data.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 p-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
                <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor={`alt-${m.id}`} className="text-xs text-muted-foreground">
                  {i === 0 ? "Main photo · alt text" : `Photo ${i + 1} · alt text`}
                </label>
                <Input
                  id={`alt-${m.id}`}
                  defaultValue={m.alt}
                  onBlur={(e) => e.target.value !== m.alt && run(() => updateMediaAlt(m.id, e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0 || pending} onClick={() => run(() => moveMedia(m.id, -1))}>
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={i === items.length - 1 || pending}
                  onClick={() => run(() => moveMedia(m.id, 1))}
                >
                  <ArrowDownIcon />
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Delete photo"
                disabled={pending}
                onClick={() => confirm("Delete this photo?") && run(() => deleteMedia(m.id))}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
