"use client";

import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

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

/**
 * The photos of one design (or the shared photos when `variantId` is null), shown inside that
 * design's row in the product editor with its own Upload button. Where a photo is uploaded is
 * the design it belongs to; "Move to" fixes a mistake.
 *
 * Lives inside the product <form>: controls carry no `name`, so nothing here is submitted with
 * the product, and every button is type="button".
 */
export function DesignPhotos({
  productId,
  variantId,
  label,
  items,
  targets,
  isMain,
}: {
  productId: string;
  variantId: string | null;
  /** Used in messages, e.g. "Design 2 · Temple pallu" or "Shared photos". */
  label: string;
  items: MediaItem[];
  /** Designs a photo can be moved to (all saved designs). */
  targets: MediaVariantOption[];
  /** The first photo here is the product's main image (shop listing, link previews). */
  isMain: boolean;
}) {
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
    if (variantId) form.append("variantId", variantId);
    start(async () => {
      const res = await uploadProductImages(productId, form);
      toast({
        title: res.ok ? `Photos added to ${label}` : "Upload failed",
        description: res.message,
        variant: res.ok ? "default" : "destructive",
      });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function moveTo(mediaId: string, target: string) {
    start(async () => {
      const res = await setMediaVariant(mediaId, target === "shared" ? null : target);
      if (!res.ok) toast({ title: "Not moved", description: res.message, variant: "destructive" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" aria-busy={pending}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Photos{" "}
          <span className="font-normal text-muted-foreground">
            ({items.length}
            {variantId ? "" : ", optional"})
          </span>
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          aria-label={`Upload photos for ${label}`}
        >
          <ImagePlusIcon /> {pending ? "Working…" : "Upload photos"}
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
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {variantId
            ? "No photos for this design yet. Daylight, true colour, 6–8 photos."
            : "None. Add photos here only if they are true of every design."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m, i) => (
            <li key={m.id} className="flex gap-3 rounded-md border border-border p-2">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-muted">
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <label htmlFor={`alt-${m.id}`} className="block text-xs text-muted-foreground">
                  {i === 0
                    ? isMain
                      ? "Main photo · alt text"
                      : "First photo · alt text"
                    : `Photo ${i + 1} · alt text`}
                </label>
                <Input
                  id={`alt-${m.id}`}
                  defaultValue={m.alt}
                  onBlur={(e) =>
                    e.target.value !== m.alt && run(() => updateMediaAlt(m.id, e.target.value))
                  }
                  className="h-8 text-xs"
                />
                <select
                  aria-label="Move this photo to another design"
                  value=""
                  disabled={pending}
                  onChange={(e) => e.target.value && moveTo(m.id, e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs"
                >
                  <option value="">Move to…</option>
                  {targets
                    .filter((t) => t.id !== variantId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  {variantId && <option value="shared">Shared by all designs</option>}
                </select>
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move earlier"
                    disabled={i === 0 || pending}
                    onClick={() => run(() => moveMedia(m.id, -1))}
                  >
                    <ArrowLeftIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move later"
                    disabled={i === items.length - 1 || pending}
                    onClick={() => run(() => moveMedia(m.id, 1))}
                  >
                    <ArrowRightIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    aria-label="Delete photo"
                    disabled={pending}
                    onClick={() => confirm("Delete this photo?") && run(() => deleteMedia(m.id))}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
