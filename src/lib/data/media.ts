const BUCKET = "product-media";

/** Public URL for an object in the product-media bucket (served through next/image). */
export function productMediaUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const path = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}
