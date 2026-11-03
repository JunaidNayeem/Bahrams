import { describe, expect, it } from "vitest";
import { siteOrigin } from "@/config/routes";
import {
  STATIC_SITEMAP_PATHS,
  articleSitemapEntries,
  buildRobots,
  collectionSitemapEntries,
  escapeXmlUrl,
  listingPaths,
  productSitemapEntries,
  sitemapIndexXml,
  staticPageSitemapEntries,
} from "./sitemap";

const origin = siteOrigin();

describe("productSitemapEntries", () => {
  it("builds absolute product URLs with lastModified and XML-escaped image URLs", () => {
    const [entry] = productSitemapEntries([
      {
        slug: "rust-tussar",
        updatedAt: "2026-10-30T10:00:00Z",
        images: ["/storage/v1/render/image/public/media/a.jpg?width=1200&quality=80"],
      },
    ]);
    expect(entry.url).toBe(`${origin}/products/rust-tussar`);
    expect(entry.lastModified).toBe("2026-10-30T10:00:00Z");
    expect(entry.images).toEqual([
      `${origin}/storage/v1/render/image/public/media/a.jpg?width=1200&amp;quality=80`,
    ]);
  });
});

describe("collectionSitemapEntries", () => {
  it("covers every listing in the URL map and merges updates", () => {
    const paths = listingPaths();
    expect(paths).toContain("/sarees/tussar-silk");
    expect(paths).toContain("/fabric/matka-silk");
    expect(paths).toContain("/occasion/puja");
    expect(paths).toContain("/shop/3000-to-7000");
    expect(paths).toContain("/home-furnishing");
    expect(new Set(paths).size).toBe(paths.length);

    const entries = collectionSitemapEntries(
      [{ path: "/sarees/tussar-silk", updatedAt: "2026-10-29", images: ["/media/tussar.jpg"] }],
      ["/home-furnishing"],
    );
    expect(entries).toHaveLength(paths.length - 1);
    const tussar = entries.find((e) => e.url === `${origin}/sarees/tussar-silk`);
    expect(tussar).toMatchObject({
      lastModified: "2026-10-29",
      images: [`${origin}/media/tussar.jpg`],
    });
    expect(entries.some((e) => e.url.endsWith("/home-furnishing"))).toBe(false);
  });
});

describe("articleSitemapEntries", () => {
  it("always lists pillar guides and adds journal and weaver pages", () => {
    const entries = articleSitemapEntries([
      { kind: "journal", slug: "flood-recovery", updatedAt: "2026-10-01" },
      { kind: "weaver", slug: "rekha-devi", updatedAt: "2026-09-01" },
      { kind: "guide", slug: "saree-care", updatedAt: "2026-08-01" },
    ]);
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${origin}/guides/bhagalpur-silk-guide`);
    expect(urls).toContain(`${origin}/journal/flood-recovery`);
    expect(urls).toContain(`${origin}/weavers/rekha-devi`);
    expect(urls.filter((u) => u.endsWith("/guides/saree-care"))).toHaveLength(1);
    expect(entries.find((e) => e.url.endsWith("/guides/saree-care"))?.lastModified).toBe(
      "2026-08-01",
    );
  });
});

describe("staticPageSitemapEntries", () => {
  it("lists public static pages and never private or thin ones", () => {
    const urls = staticPageSitemapEntries().map((e) => e.url);
    expect(urls[0]).toBe(origin);
    expect(urls).toContain(`${origin}/legal/privacy`);
    for (const blocked of ["/cart", "/checkout", "/account", "/login", "/search", "/track-order"]) {
      expect(STATIC_SITEMAP_PATHS).not.toContain(blocked);
    }
  });
});

describe("buildRobots", () => {
  it("blocks private areas and internal search results, and lists the sitemaps", () => {
    const robots = buildRobots();
    const rules = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual([
      "/admin",
      "/account",
      "/cart",
      "/checkout",
      "/api",
      "/search?",
    ]);
    expect(robots.sitemap).toBe(`${origin}/sitemap.xml`);
  });

  it("blocks everything on non-production deployments", () => {
    const robots = buildRobots(false);
    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect(robots.sitemap).toBeUndefined();
  });
});

describe("sitemapIndexXml", () => {
  it("lists every child sitemap and leaves out the unpublished articles map", () => {
    const xml = sitemapIndexXml("2026-11-03T00:00:00Z");
    expect(xml).toContain("<sitemapindex");
    for (const id of ["static", "collections", "products"]) {
      expect(xml).toContain(`<loc>${origin}/sitemap/${id}.xml</loc>`);
    }
    expect(xml).not.toContain("articles");
    expect(xml).toContain("<lastmod>2026-11-03T00:00:00.000Z</lastmod>");
  });

  it("keeps placeholder pages that are noindex out of the static map", () => {
    const urls = staticPageSitemapEntries().map((e) => e.url);
    expect(urls).not.toContain(`${origin}/journal`);
    expect(urls).not.toContain(`${origin}/bulk-enquiries`);
  });
});

describe("escapeXmlUrl", () => {
  it("escapes XML special characters", () => {
    expect(escapeXmlUrl(`a?b=1&c="<'>"`)).toBe("a?b=1&amp;c=&quot;&lt;&apos;&gt;&quot;");
  });
});
