# Logo: "Peepal on the Ganga"

A peepal leaf (Bihar's state tree, and a motif in Bhagalpuri weaving) drawn in two halves:

- **Upper half:** the leaf's veins, drawn as zari threads.
- **Lower half:** a woven panel. Warp threads run down and the weft ripples across them like the
  Ganga at Bhagalpur, so the mark says _where_ and _how_ in one shape.
- **Wordmark:** "Bahram" with "SILKS" set in Cormorant Garamond (the site's display face), above a
  saree temple border and the line "The weaving house of Bhagalpur".

It sits between kickoff concepts A and B (a thread-drawn mark, place-rooted). It is a pointed leaf,
never a circle or an oval, so it stays clear of the Silk Mark cocoon, the Handloom Mark and the
India Handloom Brand logo. Run the trademark search (classes 24, 25, 35) before printing packaging.

## Files

| Need                                  | File (`public/brand/`)                               |
| ------------------------------------- | ---------------------------------------------------- |
| Default logo, light background        | `logo-primary.svg` · `png/logo-primary.png`          |
| On madder, charcoal or a photo        | `logo-primary-reversed.svg` (has its madder ground)  |
| Header, letterhead, invoice, email    | `logo-horizontal.svg` (`-reversed` for dark grounds) |
| One ink: stamp, foil, embroidery, fax | `logo-mono.svg`, `mark-mono.svg`                     |
| Social avatar, small spaces, seal     | `mark.svg`, `mark-reversed.svg`, `png/mark*.png`     |
| App icon, WhatsApp Business, Google   | `png/app-icon-1024.png`, `logo-512.png`              |
| Favicon, iOS home screen              | `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`  |
| Link previews (WhatsApp, Facebook, X) | `public/og/default.jpg` (1200 × 630)                 |

Text in the SVGs is converted to outlines, so the files render the same everywhere without the font.
In the app, use `<BrandMark>` (`tone="color" | "reversed" | "mono"`) with `<Wordmark>`, and
`<BrandLoader>` for loading states.

## Colours

| Role          | Token               | Hex                        |
| ------------- | ------------------- | -------------------------- |
| Leaf, name    | madder-700/800      | `#8E2420` / `#75201D`      |
| Zari lines    | gold-300            | `#DFBE6E`                  |
| "SILKS", rule | gold-700 / gold-500 | `#835A1F` / `#C08F2E`      |
| Ground        | ivory-100           | `#FBF7EE`                  |
| Single colour | charcoal-900        | `#26221F` (or any one ink) |

For print, ask the printer to match the hex values to Pantone. Foil the zari lines in gold on madder
boxes.

## Rules

- **Clear space:** keep a margin of at least the leaf's width ÷ 2 on every side.
- **Minimum size:** the full mark from 40 px (12 mm in print). Below that, use the simplified favicon
  drawing (`<BrandMark>` switches automatically under 40 px). The full lockup with tagline needs at
  least 160 px (45 mm) wide, or drop the tagline.
- **Do not** recolour the leaf outside the palette, add a circle or box around it, stretch it,
  rotate it, put stripe patterns behind it, or set the name in another typeface.
- **Founding year:** add "Est. 1948" under the tagline only once the client confirms it.
