"use client";

import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ImagePlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import {
  deleteMedia,
  moveMedia,
  setMediaVariant,
  updateMediaAlt,
  uploadProductImages,
} from "@/app/admin/(panel)/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export interface MediaItem {
  id: string;
  url: string;
  alt: string;
  /** The design this photo shows; null when shared by every design. */
  variantId: string | null;
}

export interface MediaVariantOption {
  id: string;
  /** "Design 2 · Peacock border" */
  label: string;
}

const selectCls = "h-8 w-full rounded-md border border-input bg-card px-2 text-xs";

export function MediaManager({
  productId,
  items,
  variants,
}: {
  productId: string;
  items: MediaItem[];
  variants: MediaVariantOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploadFor, setUploadFor] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const multi = variants.length > 1;
  // Once any photo belongs to a design, a design without photos would show only shared ones.
  const usesDesignPhotos = items.some((m) => m.variantId);
  const withoutPhotos = usesDesignPhotos
    ? variants.filter((v) => !items.some((m) => m.variantId === v.id))
    : [];

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append("files", f);
    if (uploadFor) form.append("variantId", uploadFor);
    start(async () => {
      const res = await uploadProductImages(productId, form);
      toast({
        title: res.ok ? "Photos added" : "Upload failed",
        description: res.message,
        variant: res.ok ? "default" : "destructive",
      });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function assign(mediaId: string, variantId: string) {
    start(async () => {
      const res = await setMediaVariant(mediaId, variantId || null);
      if (!res.ok)
        toast({ title: "Not changed", description: res.message, variant: "destructive" });
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card" aria-busy={pending}>
      <div className="space-y-3 border-b border-border px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Photos</h2>
            <p className="text-xs text-muted-foreground">
              {multi
                ? "Give each design its own photos so shoppers see exactly the piece they pick. Shared photos show with every design."
                : "First photo is the main image. Daylight, true colour, 6–8 per piece."}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlusIcon /> {pending ? "Working…" : "Upload"}
          </Button>
        </div>
        {multi && (
          <div className="space-y-1">
            <label htmlFor="upload-for" className="text-xs text-muted-foreground">
              Upload photos for
            </label>
            <select
              id="upload-for"
              value={uploadFor}
              onChange={(e) => setUploadFor(e.target.value)}
              className={selectCls}
            >
              <option value="">All designs (shared)</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      {withoutPhotos.length > 0 && (
        <p className="flex gap-2 border-b border-border bg-warning/10 px-5 py-2 text-xs">
          <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
          <span>
            No photos yet for {withoutPhotos.map((v) => v.label).join(", ")}. Shoppers choosing{" "}
            {withoutPhotos.length > 1 ? "these designs" : "this design"} will see only the shared
            photos.
          </span>
        </p>
      )}
      {items.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          No photos yet. Uploads are converted to WebP and stripped of location data.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m, i) => (
            <li key={m.id} className="flex items-center gap-3 p-3">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
                <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {multi && (
                  <select
                    aria-label={`Design shown in photo ${i + 1}`}
                    value={m.variantId ?? ""}
                    disabled={pending}
                    onChange={(e) => assign(m.id, e.target.value)}
                    className={selectCls}
                  >
                    <option value="">All designs (shared)</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                )}
                <label htmlFor={`alt-${m.id}`} className="block text-xs text-muted-foreground">
                  {i === 0 ? "Main photo · alt text" : `Photo ${i + 1} · alt text`}
                </label>
                <Input
                  id={`alt-${m.id}`}
                  defaultValue={m.alt}
                  onBlur={(e) =>
                    e.target.value !== m.alt && run(() => updateMediaAlt(m.id, e.target.value))
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move up"
                  disabled={i === 0 || pending}
                  onClick={() => run(() => moveMedia(m.id, -1))}
                >
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
