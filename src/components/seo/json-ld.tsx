import { serializeJsonLd, type JsonLdDocument } from "@/lib/seo/jsonld";

type JsonLdInput = JsonLdDocument | null | undefined;

export interface JsonLdProps {
  /** One document or several; null/undefined entries (e.g. an empty FAQ) are skipped. */
  data: JsonLdInput | readonly JsonLdInput[];
}

/**
 * Renders structured data as <script type="application/ld+json"> tags, one per document.
 * Server component: the JSON is in the initial HTML, which is where crawlers read it.
 */
export function JsonLd({ data }: JsonLdProps) {
  const documents = (Array.isArray(data) ? data : [data]).filter(
    (doc): doc is JsonLdDocument => doc != null,
  );
  return documents.map((doc, index) => (
    <script
      key={index}
      type="application/ld+json"
      // Safe: serializeJsonLd escapes "<", ">" and "&", so the payload cannot close the tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(doc) }}
    />
  ));
}
