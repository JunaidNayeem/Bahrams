// Generates sample product images for dev/demo projects and uploads them to the product-media bucket
// at the storage paths referenced by supabase/seed.sql. They are woven-texture placeholders in each
// product's colour, not photographs; real photography replaces them via the admin media library.
//
// Usage: node --env-file=.env.local scripts/seed-sample-media.mjs [--allow-remote]
// --allow-remote is required for a hosted (demo) project, so placeholders never land in production
// by accident. It overwrites files at the seeded paths.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key)
  throw new Error("Run with --env-file=.env.local (needs Supabase URL + service key)");
if (!/127\.0\.0\.1|localhost/.test(url) && !process.argv.includes("--allow-remote")) {
  throw new Error(
    `Refusing to upload sample media to ${url} without --allow-remote (demo projects only)`,
  );
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const W = 1200;
const H = 1500;
const ZARI = "#C9A13B";

// Deterministic pseudo-random so re-runs produce identical files.
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * (1 + amount))));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** Slubby warp/weft lines: the irregular texture of tussar, ghicha and matka. */
function weave(rand, base, density, slubby) {
  let lines = "";
  for (let y = 0; y < H; y += density) {
    const o = (rand() - 0.5) * (slubby ? 0.5 : 0.15);
    lines += `<rect x="0" y="${y}" width="${W}" height="${density / 2}" fill="${shade(base, o)}" opacity="0.55"/>`;
  }
  for (let x = 0; x < W; x += density * 1.5) {
    lines += `<rect x="${x}" y="0" width="1" height="${H}" fill="${shade(base, -0.25)}" opacity="0.25"/>`;
  }
  if (slubby) {
    for (let i = 0; i < 160; i++) {
      const y = rand() * H;
      const x = rand() * W;
      lines += `<rect x="${x}" y="${y}" width="${20 + rand() * 90}" height="${2 + rand() * 3}" fill="${shade(base, 0.2)}" opacity="0.6"/>`;
    }
  }
  return lines;
}

function border(y, h, base, zari) {
  const accent = zari ? ZARI : shade(base, -0.45);
  return `<rect x="0" y="${y}" width="${W}" height="${h}" fill="${accent}"/>
    <rect x="0" y="${y + h * 0.18}" width="${W}" height="${h * 0.08}" fill="${shade(base, 0.25)}"/>
    <rect x="0" y="${y + h * 0.74}" width="${W}" height="${h * 0.08}" fill="${shade(base, 0.25)}"/>`;
}

function svgFor({ path, base, fibre, zari }) {
  const rand = rng(path);
  const slubby = ["tussar", "ghicha", "matka", "raw_silk", "noil"].includes(fibre);
  const view = path.match(/\/(\d+)\.webp$/)?.[1] ?? "01";
  let body;
  if (view === "02") {
    // Close-up of the weave: larger threads.
    body = weave(rand, base, 18, slubby);
  } else if (view === "03") {
    // Border / pallu detail.
    body = weave(rand, base, 8, slubby) + border(H * 0.45, H * 0.3, base, zari);
  } else {
    // Full drape: soft vertical folds and a border near the hem.
    let folds = "";
    for (let x = 0; x < W; x += 150) {
      folds += `<rect x="${x}" y="0" width="75" height="${H}" fill="${shade(base, -0.12)}" opacity="0.35"/>`;
    }
    body = weave(rand, base, 6, slubby) + folds + border(H * 0.82, H * 0.1, base, zari);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${base}"/>${body}</svg>`;
}

const { data: rows, error } = await supabase
  .from("product_media")
  .select(
    "storage_path, kind, products(primary_fibre, zari, product_variants(colour_hex, position))",
  )
  .eq("kind", "image");
if (error) throw error;

let done = 0;
for (const row of rows) {
  const variants = [...(row.products?.product_variants ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  const base = variants.find((v) => v.colour_hex)?.colour_hex ?? "#C8A46A";
  const svg = svgFor({
    path: row.storage_path,
    base,
    fibre: row.products?.primary_fibre,
    zari: Boolean(row.products?.zari),
  });
  const webp = await sharp(Buffer.from(svg)).webp({ quality: 78 }).toBuffer();
  const { error: upErr } = await supabase.storage
    .from("product-media")
    .upload(row.storage_path, webp, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
  if (upErr) throw new Error(`${row.storage_path}: ${upErr.message}`);
  done++;
}
console.log(`Uploaded ${done} sample images to product-media.`);
