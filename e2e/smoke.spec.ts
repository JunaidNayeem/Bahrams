import { expect, test } from "@playwright/test";

/**
 * Smoke tests: the app boots, core public routes respond and platform headers are in place.
 * Journey tests (browse, cart, checkout in Razorpay test mode, admin) land with their sprints.
 */

test.describe("platform", () => {
  test("health endpoint reports ok and is not cached", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = (await response.json()) as { status: string; time: string };
    expect(body.status).toBe("ok");
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  test("security headers are sent", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("https://checkout.razorpay.com");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("admin is excluded from search engines", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("home", () => {
  test("renders a single h1 and the Bahram Silks wordmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    // The header wordmark is a link home whose accessible name is the brand name.
    await expect(page.getByRole("link", { name: /bahram silks/i }).first()).toBeVisible();
  });
});

test.describe("design system", () => {
  test("styleguide renders", async ({ page }) => {
    const response = await page.goto("/styleguide");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
});

test.describe("SEO endpoints", () => {
  test("robots.txt is served and points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/user-agent:/i);
    expect(body).toMatch(/sitemap:\s*https?:\/\/\S+sitemap\.xml/i);
    expect(body).toMatch(/disallow:\s*\/admin/i);
  });

  test("sitemap.xml is served as XML", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    expect(await response.text()).toMatch(/<(urlset|sitemapindex)\b/);
  });
});

// TODO(sprint: storefront catalogue): collection page lists products with a 2-column mobile grid,
// canonical drops sort/filter params, and the product page shows proof (Silk Mark number, weaver).
test.fixme("collection → product page shows price, composition and proof", async () => {});

// TODO(sprint: cart & checkout): add to cart, start checkout (reserves a one-of-a-kind piece),
// pay with Razorpay test mode, land on /checkout/confirmation/[orderNumber].
test.fixme("guest checkout completes in Razorpay test mode", async () => {});

// TODO(sprint: COD): COD hidden above the order-value limit and on unserviceable PIN codes.
test.fixme("COD availability follows order value and PIN rules", async () => {});

// TODO(sprint: admin orders): staff login, confirm a COD order, move it to packed and shipped.
test.fixme("staff can confirm and ship an order", async () => {});
