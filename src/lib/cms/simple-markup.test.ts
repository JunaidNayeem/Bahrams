import { describe, expect, it } from "vitest";

import { htmlToMarkup, markupToHtml } from "./simple-markup";

describe("markupToHtml", () => {
  it("renders headings, paragraphs, lists, bold and links", () => {
    const html = markupToHtml("## Returns\n\nYou have **7 days**.\n\n- Exchange\n- Store credit\n\n1. Pack it\n2. Book pickup\n\nSee [our policy](/legal/returns-policy).");
    expect(html).toBe(
      "<h2>Returns</h2><p>You have <strong>7 days</strong>.</p><ul><li>Exchange</li><li>Store credit</li></ul><ol><li>Pack it</li><li>Book pickup</li></ol><p>See <a href=\"/legal/returns-policy\">our policy</a>.</p>",
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
    expect(markupToHtml("[x](https://silkmarkindia.com)")).toContain('<a href="https://silkmarkindia.com">');
  });

  it("joins single line breaks inside a paragraph with <br>", () => {
    expect(markupToHtml("line one\nline two")).toBe("<p>line one<br>line two</p>");
  });
});

describe("htmlToMarkup", () => {
  it("round-trips the supported constructs", () => {
    const source = "## Title\n\nA **bold** move.\n\n- one\n- two\n\nRead [this](/guides/saree-care).";
    expect(markupToHtml(htmlToMarkup(markupToHtml(source)))).toBe(markupToHtml(source));
  });
});
