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

interface Group {
  /** Variant id, "" for shared photos, or "orphan" for photos of designs no longer active. */
  key: string;
  title: string;
  hint?: string;
  items: MediaItem[];
  canUpload: boolean;
}

const selectCls = "h-8 w-full rounded-md border border-input bg-card px-2 text-xs";

/**
 * Photos grouped by design. Each design has its own section and Upload button, so a photo's design
 * is set by where it is uploaded and visible at a glance; "Move to" fixes a mistake.
 */
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
  const fileRef = useRef<HTMLInputElement>(null);
  // Which section's Upload button opened the file picker ("" = shared).
  const uploadFor = useRef("");
  const multi = variants.length > 1;

  const groups: Group[] = multi
    ? [
        ...variants.map((v) => ({
          key: v.id,
          title: v.label,
          items: items.filter((m) => m.variantId === v.id),
          canUpload: true,
        })),
        {
          key: "",
          title: "Shared by all designs",
          hint: "Optional: photos true of every design, e.g. a fabric close-up or the blouse piece.",
          items: items.filter((m) => !m.variantId),
          canUpload: true,
        },
        {
          key: "orphan",
          title: "Photos of removed designs",
          hint: "Not shown in the store. Move them to a design or delete them.",
          items: items.filter((m) => m.variantId && !variants.some((v) => v.id === m.variantId)),
          canUpload: false,
        },
      ].filter((g) => g.key !== "orphan" || g.items.length > 0)
    : [{ key: "", title: "", items, canUpload: true }];

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  function pick(groupKey: string) {
    uploadFor.current = groupKey;
    fileRef.current?.click();
  }

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of files) form.append("files", f);
    if (multi && uploadFor.current) form.append("variantId", uploadFor.current);
    const target = groups.find((g) => g.key === uploadFor.current)?.title;
    start(async () => {
      const res = await uploadProductImages(productId, form);
      toast({
        title: res.ok
          ? multi && target
            ? `Photos added to ${target}`
            : "Photos added"
          : "Upload failed",
        description: res.message,
        variant: res.ok ? "default" : "destructive",
      });
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    });
  }

  function moveTo(mediaId: string, variantId: string) {
    start(async () => {
      const res = await setMediaVariant(mediaId, variantId || null);
      if (!res.ok) toast({ title: "Not moved", description: res.message, variant: "destructive" });
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card" aria-busy={pending}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold">Photos</h2>
          <p className="text-xs text-muted-foreground">
            {multi
              ? "Upload each design's photos in its own section, so shoppers see exactly the piece they pick."
              : "First photo is the main image. Daylight, true colour, 6–8 per piece."}
          </p>
        </div>
        {!multi && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => pick("")}
          >
            <ImagePlusIcon /> {pending ? "Working…" : "Upload"}
          </Button>
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

      {!multi && (
        <p className="border-b border-border px-5 py-2 text-xs text-muted-foreground">
          Several designs of this piece? Add them under <strong>Variants and prices</strong> with{" "}
          <strong>Add design</strong> and save: each design then gets its own photo section here.
        </p>
      )}

      {groups.map((g) => (
        <div
          key={g.key || "shared"}
          className={multi ? "border-b border-border last:border-b-0" : undefined}
        >
          {multi && (
            <div className="flex items-start justify-between gap-3 bg-muted/40 px-5 py-2.5">
              <div className="min-w-0">
                <h3 className="text-sm font-medium">
                  {g.title}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({g.items.length} photo{g.items.length === 1 ? "" : "s"})
                  </span>
                </h3>
                {g.hint && <p className="text-xs text-muted-foreground">{g.hint}</p>}
                {g.key && g.key !== "orphan" && g.items.length === 0 && (
                  <p className="mt-1 flex items-center gap-1.5 rounded bg-warning/10 px-2 py-1 text-xs">
                    <AlertTriangleIcon className="size-3.5 shrink-0 text-warning" aria-hidden /> No
                    photos yet: shoppers choosing this design see only the shared photos.
                  </p>
                )}
              </div>
              {g.canUpload && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => pick(g.key)}
                  aria-label={`Upload photos for ${g.title}`}
                >
                  <ImagePlusIcon /> Upload
                </Button>
              )}
            </div>
          )}

          {g.items.length === 0 ? (
            !multi && (
              <p className="p-5 text-sm text-muted-foreground">
                No photos yet. Uploads are converted to WebP and stripped of location data.
              </p>
            )
          ) : (
            <ul className="divide-y divide-border">
              {g.items.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 p-3">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
                    <Image src={m.url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
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
                    {multi && (
                      <select
                        aria-label="Move this photo to another design"
                        value=""
                        disabled={pending}
                        onChange={(e) =>
                          e.target.value &&
                          moveTo(m.id, e.target.value === "shared" ? "" : e.target.value)
                        }
                        className={selectCls}
                      >
                        <option value="">Move to…</option>
                        {variants
                          .filter((v) => v.id !== m.variantId)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        {m.variantId && <option value="shared">Shared by all designs</option>}
                      </select>
                    )}
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
                      disabled={i === g.items.length - 1 || pending}
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
        </div>
      ))}
    </section>
  );
}
