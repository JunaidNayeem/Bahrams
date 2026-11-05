import { describe, expect, it } from "vitest";

import { htmlToMarkup, markupToHtml } from "./simple-markup";

describe("markupToHtml", () => {
  it("renders headings, paragraphs, lists, bold and links", () => {
    const html = markupToHtml(
      "## Returns\n\nYou have **7 days**.\n\n- Exchange\n- Store credit\n\n1. Pack it\n2. Book pickup\n\nSee [our policy](/legal/returns-policy).",
    );
    expect(html).toBe(
      '<h2>Returns</h2><p>You have <strong>7 days</strong>.</p><ul><li>Exchange</li><li>Store credit</li></ul><ol><li>Pack it</li><li>Book pickup</li></ol><p>See <a href="/legal/returns-policy">our policy</a>.</p>',
    );
  });

  it("escapes HTML so scripts and attributes can never be stored", () => {
    const html = markupToHtml('<script>alert(1)</script>\n<img src=x onerror="alert(1)">');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("only links https and same-site paths", () => {
    expect(markupToHtml("[x](javascript:alert(1))")).not.toContain("<a");
    expect(markupToHtml("[x](http://insecure.example)")).not.toContain("<a");
    expect(markupToHtml("[x](https://silkmarkindia.com)")).toContain(
      '<a href="https://silkmarkindia.com">',
    );
  });

  it("joins single line breaks inside a paragraph with <br>", () => {
    expect(markupToHtml("line one\nline two")).toBe("<p>line one<br>line two</p>");
  });
});

describe("htmlToMarkup", () => {
  it("round-trips the supported constructs", () => {
    const source =
      "## Title\n\nA **bold** move.\n\n- one\n- two\n\nRead [this](/guides/saree-care).";
    expect(markupToHtml(htmlToMarkup(markupToHtml(source)))).toBe(markupToHtml(source));
  });
});

describe("images and videos", () => {
  const IMG = "https://x.supabase.co/storage/v1/object/public/cms-media/pages/a1.webp";

  it("renders an image line as a figure, with an optional caption", () => {
    expect(markupToHtml(`![Weaver at the loom](${IMG})`)).toBe(
      `<figure><img src="${IMG}" alt="Weaver at the loom" loading="lazy" decoding="async"></figure>`,
    );
    expect(markupToHtml(`![Loom](${IMG} "Our Champanagar unit")`)).toContain(
      "<figcaption>Our Champanagar unit</figcaption>",
    );
  });

  it("places media between paragraphs", () => {
    const html = markupToHtml(`First paragraph.\n![Loom](${IMG})\nSecond paragraph.`);
    expect(html).toBe(
      `<p>First paragraph.</p><figure><img src="${IMG}" alt="Loom" loading="lazy" decoding="async"></figure><p>Second paragraph.</p>`,
    );
  });

  it("only accepts https and same-site image addresses", () => {
    expect(markupToHtml("![x](javascript:alert(1))")).not.toContain("<img");
    expect(markupToHtml("![x](http://insecure.example/a.png)")).not.toContain("<img");
    expect(markupToHtml("![x](//evil.example/a.png)")).not.toContain("<img");
    expect(markupToHtml('![x" onerror="alert(1)](/a.png)')).not.toContain('" onerror="');
  });

  it("embeds YouTube (no-cookie) and Vimeo links", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(markupToHtml(`@[Tussar weaving](${url})`)).toContain(
        '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" title="Tussar weaving"',
      );
    }
    expect(markupToHtml("@[Reeling](https://vimeo.com/123456)")).toContain(
      'src="https://player.vimeo.com/video/123456?dnt=1"',
    );
  });

  it("plays uploaded MP4/WebM files and links anything else", () => {
    expect(markupToHtml("@[Pallu close-up](https://x.supabase.co/v/clip.mp4)")).toContain(
      '<video src="https://x.supabase.co/v/clip.mp4" controls preload="metadata" playsinline aria-label="Pallu close-up">',
    );
    expect(markupToHtml("@[Elsewhere](https://example.com/page)")).toBe(
      '<p><a href="https://example.com/page">Elsewhere</a></p>',
    );
    expect(markupToHtml("@[x](javascript:alert(1))")).not.toContain("<iframe");
  });

  it("round-trips images and videos through the editor", () => {
    const source = [
      "Intro.",
      "",
      `![Loom](${IMG} "Caption & more")`,
      "",
      "@[Weaving](https://youtu.be/dQw4w9WgXcQ)",
      "",
      "@[Reeling](https://vimeo.com/123456)",
      "",
      "@[Clip](https://x.supabase.co/v/clip.mp4)",
    ].join("\n");
    expect(htmlToMarkup(markupToHtml(source))).toBe(source);
  });
});
