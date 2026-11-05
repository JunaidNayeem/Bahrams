"use client";

import { FilmIcon, ImagePlusIcon, LinkIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "cms-media";
/** The cms-media bucket's own limit (supabase/migrations/…_storage.sql). */
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_SIDE = { width: 2000, height: 2500 };

/**
 * Resizes and re-encodes a photo in the browser. Drawing to a canvas drops EXIF (camera, GPS)
 * and keeps uploads small. Files go straight to Storage, so Vercel's request-size limit does
 * not apply. Safari cannot encode WebP from a canvas; it gets JPEG instead.
 */
async function prepareImage(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_IMAGE_SIDE.width / bitmap.width, MAX_IMAGE_SIDE.height / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await encode("image/webp", 0.82);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
  if (!blob) throw new Error("This photo could not be read.");
  return { blob, width, height, ext: blob.type === "image/webp" ? "webp" : "jpg" };
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();

/**
 * Buttons above the page editor that upload a photo or video (or take a YouTube / Vimeo link)
 * and hand back the markup line to insert at the cursor.
 */
export function ContentMediaToolbar({ onInsert }: { onInsert: (markup: string) => void }) {
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function store(path: string, body: Blob, contentType: string) {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, body, { contentType, cacheControl: "31536000" });
    if (error) throw new Error(error.message);
    return { supabase, url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
  }

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    try {
      for (const [i, file] of [...files].entries()) {
        setBusy(`Uploading photo ${i + 1} of ${files.length}…`);
        const alt = window.prompt(
          `Describe "${file.name}" in a few words. Google and screen-reader users read this.`,
          baseName(file.name),
        );
        if (alt === null) continue;
        const { blob, width, height, ext } = await prepareImage(file);
        const path = `pages/${crypto.randomUUID()}.${ext}`;
        const { supabase, url } = await store(path, blob, blob.type);
        await supabase.from("media_assets").insert({
          bucket: BUCKET,
          storage_path: path,
          kind: "image",
          mime_type: blob.type,
          bytes: blob.size,
          width,
          height,
          alt: alt.trim(),
        });
        onInsert(`![${alt.trim().replace(/[[\]]/g, "")}](${url})`);
      }
      toast({ title: "Photo added", description: "Inserted where your cursor was. Save the page to publish it." });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: `${e instanceof Error ? e.message : "Unknown error"}. Use a JPG, PNG or WebP photo.`,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
      if (imageRef.current) imageRef.current.value = "";
    }
  }

  async function addVideo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    try {
      if (!["video/mp4", "video/webm"].includes(file.type))
        throw new Error("Only MP4 or WebM videos can be uploaded");
      if (file.size > MAX_VIDEO_BYTES)
        throw new Error(
          `This video is ${(file.size / 1024 / 1024).toFixed(0)} MB; the limit is 20 MB. Put longer videos on YouTube and use "YouTube / Vimeo link"`,
        );
      const title = window.prompt("A short title for this video:", baseName(file.name));
      if (title === null) return;
      setBusy("Uploading video…");
      const path = `pages/videos/${crypto.randomUUID()}.${file.type === "video/webm" ? "webm" : "mp4"}`;
      const { supabase, url } = await store(path, file, file.type);
      await supabase.from("media_assets").insert({
        bucket: BUCKET,
        storage_path: path,
        kind: "video",
        mime_type: file.type,
        bytes: file.size,
        alt: title.trim(),
      });
      onInsert(`@[${title.trim().replace(/[[\]]/g, "")}](${url})`);
      toast({ title: "Video added", description: "Save the page to publish it." });
    } catch (e) {
      toast({
        title: "Video not added",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
      if (videoRef.current) videoRef.current.value = "";
    }
  }

  function addLink() {
    const url = window.prompt("Paste the YouTube or Vimeo link (https://…):")?.trim();
    if (!url) return;
    if (!/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(url)) {
      toast({ title: "Not a YouTube or Vimeo link", description: url, variant: "destructive" });
      return;
    }
    const title = window.prompt("A short title for this video:", "Video") ?? "Video";
    onInsert(`@[${title.trim().replace(/[[\]]/g, "") || "Video"}](${url})`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={Boolean(busy)}>
      <Button type="button" variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => imageRef.current?.click()}>
        <ImagePlusIcon /> Photo
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => videoRef.current?.click()}>
        <FilmIcon /> Video file
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={Boolean(busy)} onClick={addLink}>
        <LinkIcon /> YouTube / Vimeo link
      </Button>
      {busy && <span className="text-xs text-muted-foreground" role="status">{busy}</span>}
      <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => addImages(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/mp4,video/webm" hidden onChange={(e) => addVideo(e.target.files)} />
    </div>
  );
}
