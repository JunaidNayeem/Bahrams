/**
 * The small markup staff use to edit CMS pages. Everything is HTML-escaped first, then only these
 * constructs become tags, so stored page HTML can never carry scripts or arbitrary markup:
 *
 *   ## Heading        → <h2>      ### Subheading → <h3>
 *   - item            → <ul><li>  1. item        → <ol><li>
 *   **bold**          → <strong>  [text](https://… or /path) → <a>
 *   blank line        → new paragraph
 */

const escapeHtml = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]*)\)/g, (_m, label: string, href: string) => `<a href="${href}">${label}</a>`);
}

export function markupToHtml(source: string): string {
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`);
    para = [];
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (!line) {
      flushPara();
      closeList();
    } else if (line.startsWith("### ")) {
      flushPara();
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      flushPara();
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (bullet || numbered) {
      flushPara();
      const kind = bullet ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((bullet ?? numbered)![1])}</li>`);
    } else {
      closeList();
      para.push(line);
    }
  }
  flushPara();
  closeList();
  return out.join("");
}

const unescapeHtml = (t: string) =>
  t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Best-effort reverse, so existing HTML pages open in the editor as markup. */
export function htmlToMarkup(html: string): string {
  return unescapeHtml(
    html
      .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "\n## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "\n### $1\n\n")
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_m, items: string) => "\n" + items.replace(/<li[^>]*>(.*?)<\/li>/gis, (_x, i: string) => `1. ${i}\n`) + "\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gis, "- $1\n")
      .replace(/<\/?ul[^>]*>/gi, "\n")
      .replace(/<(strong|b)>(.*?)<\/\1>/gis, "**$2**")
      .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, "[$2]($1)")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
