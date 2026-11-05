import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isVercelPreview = process.env.VERCEL_ENV === "preview";

/**
 * Supabase origin the browser talks to (auth, storage, realtime). Local dev and CI run Supabase on
 * 127.0.0.1:54321 over plain HTTP, which changes what the CSP and image optimiser must allow.
 */
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321");
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseUrl.hostname);
const supabaseOrigin = supabaseUrl.origin;
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

const razorpay = {
  checkout: "https://checkout.razorpay.com",
  api: "https://api.razorpay.com",
  telemetry: "https://lumberjack.razorpay.com",
  cdn: "https://cdn.razorpay.com",
};
const googleAnalytics = [
  "https://*.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];
const clarity = ["https://*.clarity.ms", "https://c.bing.com"];
// Vercel's preview toolbar injects a script and iframe from vercel.live; never in production.
const vercelLive = isVercelPreview ? ["https://vercel.live"] : [];

/**
 * Static allow-list CSP (no nonces). A nonce must be unique per request, which forces every page
 * to render dynamically and is incompatible with the prerendered static shell that
 * cacheComponents relies on. See docs/adr/0006-caching-and-rendering.md.
 */
const csp: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    // Next.js streams the RSC payload through inline <script> tags; without nonces this is required.
    "'unsafe-inline'",
    // React uses eval in development only to rebuild server error stacks.
    ...(isDev ? ["'unsafe-eval'"] : []),
    razorpay.checkout,
    "https://*.googletagmanager.com",
    "https://*.clarity.ms",
    ...vercelLive,
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    supabaseOrigin,
    "https://*.supabase.co",
    razorpay.cdn,
    ...googleAnalytics,
    ...clarity,
    ...vercelLive,
  ],
  "media-src": ["'self'", "blob:", supabaseOrigin, "https://*.supabase.co"],
  "font-src": ["'self'", "data:", ...vercelLive],
  "connect-src": [
    "'self'",
    supabaseOrigin,
    supabaseWsOrigin,
    "https://*.supabase.co",
    "wss://*.supabase.co",
    razorpay.api,
    razorpay.checkout,
    razorpay.telemetry,
    ...googleAnalytics,
    ...clarity,
    ...vercelLive,
  ],
  // Videos embedded in CMS pages (src/lib/cms/simple-markup.ts): YouTube no-cookie and Vimeo only.
  "frame-src": [
    razorpay.api,
    razorpay.checkout,
    "https://www.youtube-nocookie.com",
    "https://player.vimeo.com",
    ...vercelLive,
  ],
  "worker-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  // Razorpay's redirect flow (used by some UPI and netbanking methods) posts to api.razorpay.com.
  "form-action": ["'self'", razorpay.api],
  "frame-ancestors": ["'none'"],
  // Local Supabase is plain HTTP; upgrading those requests would break images and auth locally.
  ...(isDev || isLocalSupabase ? {} : { "upgrade-insecure-requests": [] }),
};

const contentSecurityPolicy = Object.entries(csp)
  .map(([directive, sources]) => [directive, ...sources].join(" "))
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Razorpay checkout may open a popup for 3-D Secure and UPI apps; same-origin would sever it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "usb=()",
      "browsing-topics=()",
      `payment=(self "${razorpay.api}" "${razorpay.checkout}")`,
    ].join(", "),
  },
];

/** Private or transactional pages that must never appear in search results (ADR 0007). */
const noindexPaths = [
  "/admin",
  "/admin/:path*",
  "/account",
  "/account/:path*",
  "/cart",
  "/checkout",
  "/checkout/:path*",
  "/login",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Admin product-photo uploads go through a server action (resized to WebP server-side).
    serverActions: { bodySizeLimit: "12mb" },
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Tuned for mid-range Android phones first (360–414 CSS px), then tablet and desktop.
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [60, 75, 90],
    // Uploads get a new object path, so optimised variants can be cached for a month;
    // this keeps Supabase egress (5 GB on Free) and Vercel transformations low.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    // Next blocks optimising images from private IPs; allow it only against a local Supabase.
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
  async rewrites() {
    return {
      // app/sitemap.ts (generateSitemaps) reserves /sitemap.xml but serves nothing there, so the
      // index lives at /sitemap-index.xml and is exposed at the conventional URL before routing.
      beforeFiles: [{ source: "/sitemap.xml", destination: "/sitemap-index.xml" }],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...noindexPaths.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
      // Internal search results are thin pages, but the products they link to should be crawled.
      { source: "/search", headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }] },
      // Preview deployments are public URLs on *.vercel.app; keep them out of search entirely
      // (images and files included, which page-level robots tags cannot cover).
      ...(isVercelPreview
        ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
        : []),
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Turbopack hands MDX options to Rust, so remark/rehype plugins must be named by package string
// (e.g. remarkPlugins: ["remark-gfm"]), never passed as imported functions.
const withMDX = createMDX({ extension: /\.(md|mdx)$/ });

export default withMDX(nextConfig);
