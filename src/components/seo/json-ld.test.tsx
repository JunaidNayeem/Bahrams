import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "./json-ld";
import { faqPageJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

describe("<JsonLd>", () => {
  it("renders one script per document and skips null entries", () => {
    const html = renderToStaticMarkup(<JsonLd data={[websiteJsonLd(), faqPageJsonLd([]), null]} />);
    expect(html.match(/<script type="application\/ld\+json">/g)).toHaveLength(1);
    expect(html).toContain('"@type":"WebSite"');
  });

  it("escapes markup so the payload cannot close the script tag", () => {
    const doc = {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "</script><b>x</b>",
    } as const;
    const html = renderToStaticMarkup(<JsonLd data={doc} />);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json).name).toBe("</script><b>x</b>");
  });
});
