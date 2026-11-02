/** Tests for the SEO-owned config: src/config/routes.ts, navigation.ts and keyword-map.ts. */
import { describe, expect, it } from "vitest";
import {
  FABRIC_COLLECTIONS,
  SAREE_COLLECTIONS,
  absoluteUrl,
  accountUrls,
  adminUrls,
  checkoutConfirmationUrl,
  collectionUrl,
  isOccasion,
  isSareeCollectionSlug,
  journalUrl,
  loginUrl,
  productUrl,
  searchUrl,
  siteOrigin,
} from "@/config/routes";
import {
  adminNavigation,
  adminNavigationFor,
  footerLegalLinks,
  footerNavigation,
  headerNavigation,
} from "@/config/navigation";
import { KEYWORD_MAP, keywordTargetFor } from "@/config/keyword-map";
import { STAFF_ROLES } from "@/lib/domain/enums";

/** The canonical storefront URL map from the build brief. */
const STOREFRONT_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/sarees(\/(tussar-silk|raw-silk|matka-silk|ghicha-silk|cotton-silk|linen|zari-bridal|bhagalpuri-silk|new-arrivals))?$/,
  /^\/fabric(\/(raw-silk|tussar-silk|matka-silk|linen-stripe|cotton-silk|swatches))?$/,
  /^\/(stoles-dupattas|dress-material|kurta-fabric|home-furnishing)$/,
  /^\/occasion\/(office|festive|wedding|puja|gifting)$/,
  /^\/shop\/(under-3000|3000-to-7000|above-7000)$/,
  /^\/products\/[a-z0-9-]+$/,
  /^\/(search|our-story|weavers|journal|track-order|contact|bulk-enquiries|grievance|cart|checkout|login)$/,
  /^\/weavers\/[a-z0-9-]+$/,
  /^\/guides\/(bhagalpur-silk-guide|silk-types-explained|how-to-verify-silk-mark|saree-care)$/,
  /^\/journal\/[a-z0-9-]+$/,
  /^\/help\/(shipping|returns|faq)$/,
  /^\/legal\/(terms|privacy|shipping-policy|returns-policy|cancellation)$/,
];

const ADMIN_ROUTES = new Set([
  "/admin/login",
  "/admin",
  "/admin/products",
  "/admin/products/new",
  "/admin/collections",
  "/admin/media",
  "/admin/authenticity",
  "/admin/inventory",
  "/admin/orders",
  "/admin/shipments",
  "/admin/returns",
  "/admin/customers",
  "/admin/reviews",
  "/admin/content",
  "/admin/promotions",
  "/admin/reports",
  "/admin/grievances",
  "/admin/privacy-requests",
  "/admin/settings",
  "/admin/settings/staff",
  "/admin/audit-log",
]);

const isStorefrontRoute = (href: string) => STOREFRONT_ROUTE_PATTERNS.some((re) => re.test(href));

describe("routes", () => {
  it("builds URLs without trailing slashes", () => {
    expect(productUrl("rust-tussar")).toBe("/products/rust-tussar");
    expect(collectionUrl("fabric", "matka-silk")).toBe("/fabric/matka-silk");
    expect(journalUrl()).toBe("/journal");
    expect(journalUrl("flood-recovery")).toBe("/journal/flood-recovery");
    expect(accountUrls.order("BS-1001")).toBe("/account/orders/BS-1001");
    expect(adminUrls.product("abc")).toBe("/admin/products/abc");
    expect(checkoutConfirmationUrl("BS-1001")).toBe("/checkout/confirmation/BS-1001");
  });

  it("encodes dynamic segments and rejects empty ones", () => {
    expect(productUrl("a/b")).toBe("/products/a%2Fb");
    expect(() => productUrl("")).toThrow();
  });

  it("builds search and login URLs", () => {
    expect(searchUrl()).toBe("/search");
    expect(searchUrl("  matka saree ")).toBe("/search?q=matka+saree");
    expect(loginUrl("/account/orders")).toBe("/login?next=%2Faccount%2Forders");
    expect(loginUrl("https://evil.example")).toBe("/login");
    expect(loginUrl("//evil.example")).toBe("/login");
  });

  it("makes absolute URLs from the site origin", () => {
    const origin = siteOrigin();
    expect(origin.endsWith("/")).toBe(false);
    expect(absoluteUrl("/")).toBe(origin);
    expect(absoluteUrl("/sarees/")).toBe(`${origin}/sarees`);
    expect(absoluteUrl("fabric")).toBe(`${origin}/fabric`);
    expect(absoluteUrl("/sarees?colour=red")).toBe(`${origin}/sarees?colour=red`);
    expect(absoluteUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });

  it("puts tussar and matka first in both collection lists", () => {
    expect(SAREE_COLLECTIONS.slice(0, 2).map((c) => c.slug)).toEqual(["tussar-silk", "matka-silk"]);
    expect(FABRIC_COLLECTIONS.slice(0, 2).map((c) => c.slug)).toEqual([
      "tussar-silk",
      "matka-silk",
    ]);
  });

  it("guards slugs", () => {
    expect(isSareeCollectionSlug("tussar-silk")).toBe(true);
    expect(isSareeCollectionSlug("swatches")).toBe(false);
    expect(isOccasion("puja")).toBe(true);
    expect(isOccasion("party")).toBe(false);
  });
});

describe("navigation", () => {
  const storefrontHrefs = [
    ...headerNavigation.flatMap((item) => [
      item.href,
      ...item.groups.flatMap((g) => [...(g.href ? [g.href] : []), ...g.links.map((l) => l.href)]),
    ]),
    ...footerNavigation.flatMap((g) => g.links.map((l) => l.href)),
    ...footerLegalLinks.map((l) => l.href),
  ];

  it("links only to routes in the canonical URL map", () => {
    const invalid = storefrontHrefs.filter((href) => !isStorefrontRoute(href));
    expect(invalid).toEqual([]);
  });

  it("leads the fabric menu with tussar and matka", () => {
    const fabric = headerNavigation.find((i) => i.href === "/fabric");
    expect(fabric?.groups[0].links.slice(0, 2).map((l) => l.href)).toEqual([
      "/fabric/tussar-silk",
      "/fabric/matka-silk",
    ]);
  });

  it("covers every IA section and the required footer legal links", () => {
    for (const href of [
      "/stoles-dupattas",
      "/dress-material",
      "/kurta-fabric",
      "/home-furnishing",
    ]) {
      expect(storefrontHrefs).toContain(href);
    }
    expect(footerLegalLinks.map((l) => l.label)).toEqual([
      "Terms",
      "Privacy",
      "Shipping",
      "Returns & exchanges",
      "Cancellation",
      "Grievance officer",
      "Contact",
    ]);
  });

  it("admin items point at admin routes and name only known roles", () => {
    for (const item of adminNavigation.flatMap((g) => g.items)) {
      expect(ADMIN_ROUTES.has(item.href)).toBe(true);
      expect(item.roles.length).toBeGreaterThan(0);
      for (const role of item.roles) expect(STAFF_ROLES).toContain(role);
    }
  });

  it("owners see everything; other roles see a filtered sidebar", () => {
    const all = adminNavigation.flatMap((g) => g.items).length;
    expect(adminNavigationFor(["owner"]).flatMap((g) => g.items)).toHaveLength(all);

    const accountant = adminNavigationFor(["accountant"]).flatMap((g) =>
      g.items.map((i) => i.href),
    );
    expect(accountant).toContain("/admin/reports");
    expect(accountant).not.toContain("/admin/products");
    expect(accountant).not.toContain("/admin/settings/staff");

    const fulfilment = adminNavigationFor(["fulfilment"]);
    expect(fulfilment.every((g) => g.items.length > 0)).toBe(true);
    expect(fulfilment.flatMap((g) => g.items.map((i) => i.href))).toContain("/admin/shipments");
    expect(adminNavigationFor([])).toEqual([]);
  });
});

describe("keyword map", () => {
  it("maps each landing page once, to a route in the URL map", () => {
    const paths = KEYWORD_MAP.map((k) => k.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.filter((p) => !isStorefrontRoute(p))).toEqual([]);
  });

  it("keeps default titles and descriptions within snippet limits", () => {
    for (const target of KEYWORD_MAP) {
      expect(target.title.length, target.path).toBeLessThanOrEqual(60);
      expect(target.description.length, target.path).toBeLessThanOrEqual(155);
      expect(target.description.length, target.path).toBeGreaterThan(70);
    }
  });

  it("covers the brief's keyword clusters", () => {
    expect(keywordTargetFor("/sarees/bhagalpuri-silk")?.primary).toBe("bhagalpuri silk saree");
    expect(keywordTargetFor("/sarees/tussar-silk/")?.primary).toBe("tussar silk saree");
    expect(keywordTargetFor("/fabric/matka-silk?colour=red")?.primary).toBe("matka silk fabric");
    expect(keywordTargetFor("/occasion/office")?.primary).toBe("silk saree for office");
    expect(keywordTargetFor("/nope")).toBeUndefined();
  });
});
