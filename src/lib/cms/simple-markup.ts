/**
 * The small markup staff use to edit CMS pages. Everything is HTML-escaped first, then only these
 * constructs become tags, so stored page HTML can never carry scripts or arbitrary markup:
 *
 *   ## Heading        → <h2>      ### Subheading → <h3>
 *   - item            → <ul><li>  1. item        → <ol><li>
 *   **bold**          → <strong>  [text](https://… or /path) → <a>
 *   blank line        → new paragraph
 *
 * On a line of their own:
 *   ![Alt text](https://… or /path)             → <figure><img></figure>
 *   ![Alt text](https://… "Caption")             → the same, with a visible caption
 *   @[Title](https://youtu.be/… or vimeo.com/…)  → embedded YouTube (no-cookie) / Vimeo player
 *   @[Title](https://….mp4 or .webm)             → <video controls>
 */

const escapeHtml = (t: string) =>
  t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\(((?:https:\/\/|\/)[^)\s]*)\)/g,
      (_m, label: string, href: string) => `<a href="${href}">${label}</a>`,
    );
}

const IMAGE_LINE = /^!\[([^\]]*)\]\(((?:https:\/\/|\/(?!\/))[^)\s"]+)(?:\s+"([^"]*)")?\)$/;
const VIDEO_LINE = /^@\[([^\]]*)\]\((https:\/\/[^)\s]+)\)$/;
const YOUTUBE =
  /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO = /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)/;
const VIDEO_FILE = /\.(mp4|webm)(?:\?[^#]*)?$/i;

function imageHtml(alt: string, src: string, caption: string | undefined): string {
  const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async">`;
  return `<figure>${img}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

/** Embeds YouTube, Vimeo and uploaded MP4/WebM; any other address becomes a plain link. */
function videoHtml(title: string, url: string): string {
  const label = escapeHtml(title || "Video");
  const iframe = (src: string) =>
    `<figure data-video><iframe src="${src}" title="${label}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></figure>`;
  const youtube = YOUTUBE.exec(url);
  if (youtube) return iframe(`https://www.youtube-nocookie.com/embed/${youtube[1]}`);
  const vimeo = VIMEO.exec(url);
  if (vimeo) return iframe(`https://player.vimeo.com/video/${vimeo[1]}?dnt=1`);
  if (VIDEO_FILE.test(url))
    return `<figure data-video><video src="${escapeHtml(url)}" controls preload="metadata" playsinline aria-label="${label}"></video></figure>`;
  return `<p><a href="${escapeHtml(url)}">${label}</a></p>`;
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
    const image = IMAGE_LINE.exec(line);
    const video = VIDEO_LINE.exec(line);
    if (!line) {
      flushPara();
      closeList();
    } else if (image || video) {
      flushPara();
      closeList();
      out.push(image ? imageHtml(image[1], image[2], image[3]) : videoHtml(video![1], video![2]));
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
  t
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Best-effort reverse, so existing HTML pages open in the editor as markup. */
export function htmlToMarkup(html: string): string {
  return unescapeHtml(
    html
      .replace(
        /<figure[^>]*>\s*<img [^>]*?src="([^"]*)"[^>]*?alt="([^"]*)"[^>]*>(?:<figcaption>(.*?)<\/figcaption>)?\s*<\/figure>/gis,
        (_m, src: string, alt: string, caption?: string) =>
          `\n\n![${alt}](${src}${caption ? ` "${caption}"` : ""})\n\n`,
      )
      .replace(
        /<figure[^>]*>\s*<iframe [^>]*?src="https:\/\/www\.youtube-nocookie\.com\/embed\/([^"?]+)[^"]*"[^>]*?title="([^"]*)"[^>]*><\/iframe>\s*<\/figure>/gis,
        "\n\n@[$2](https://youtu.be/$1)\n\n",
      )
      .replace(
        /<figure[^>]*>\s*<iframe [^>]*?src="https:\/\/player\.vimeo\.com\/video\/(\d+)[^"]*"[^>]*?title="([^"]*)"[^>]*><\/iframe>\s*<\/figure>/gis,
        "\n\n@[$2](https://vimeo.com/$1)\n\n",
      )
      .replace(
        /<figure[^>]*>\s*<video [^>]*?src="([^"]*)"[^>]*?aria-label="([^"]*)"[^>]*><\/video>\s*<\/figure>/gis,
        "\n\n@[$2]($1)\n\n",
      )
      .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "\n## $1\n\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "\n### $1\n\n")
      .replace(
        /<ol[^>]*>(.*?)<\/ol>/gis,
        (_m, items: string) =>
          "\n" + items.replace(/<li[^>]*>(.*?)<\/li>/gis, (_x, i: string) => `1. ${i}\n`) + "\n",
      )
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
