/**
 * Keyword map: which landing page targets which search queries. Drives default <title> and
 * meta descriptions (admins can override per page) and documents the SEO plan.
 *
 * `source: "brief"` rows come straight from the kickoff keyword-cluster table; `"derived"` rows
 * extend the same clusters to the other collection pages. Volumes and difficulty are not yet
 * validated: check them in Semrush/Ahrefs before writing long-form copy (kickoff, "Keyword
 * clusters"). Titles exclude the brand; buildMetadata appends " | Bahram Silks" when it fits.
 */

export const KEYWORD_CLUSTERS = [
  "Bhagalpuri sarees",
  "Tussar",
  "Raw and matka silk",
  "Fabric by metre",
  "Occasion",
  "Price",
  "Product type",
  "Education",
  "Local and brand",
] as const;
export type KeywordCluster = (typeof KEYWORD_CLUSTERS)[number];

export type SearchIntent =
  "transactional" | "commercial" | "informational" | "navigational" | "local";

export interface KeywordTarget {
  cluster: KeywordCluster;
  /** Canonical landing-page path (no trailing slash). */
  path: string;
  primary: string;
  secondary: readonly string[];
  intent: SearchIntent;
  /** Default page title, without the brand suffix; aim for 60 characters or fewer. */
  title: string;
  /** Default meta description; 155 characters or fewer. */
  description: string;
  source: "brief" | "derived";
}

export const KEYWORD_MAP: readonly KeywordTarget[] = [
  // Bhagalpuri sarees
  {
    cluster: "Bhagalpuri sarees",
    path: "/sarees/bhagalpuri-silk",
    primary: "bhagalpuri silk saree",
    secondary: ["bhagalpuri saree online", "original bhagalpuri saree"],
    intent: "transactional",
    title: "Bhagalpuri Silk Sarees, Direct from Bhagalpur",
    description:
      "Original Bhagalpuri silk sarees woven in Bhagalpur and sold by the makers, with fibre composition, weaver credit and the GI tag on qualifying pieces.",
    source: "brief",
  },
  {
    cluster: "Bhagalpuri sarees",
    path: "/sarees",
    primary: "bhagalpur silk sarees",
    secondary: ["silk sarees online", "handloom silk sarees bihar"],
    intent: "transactional",
    title: "Silk Sarees from Bhagalpur: Tussar, Matka & Raw Silk",
    description:
      "Tussar, matka, raw silk, ghicha, cotton-silk and linen sarees from the looms of Bhagalpur, sold direct at maker's prices with honest fibre labels.",
    source: "derived",
  },
  {
    cluster: "Bhagalpuri sarees",
    path: "/sarees/new-arrivals",
    primary: "new bhagalpuri sarees",
    secondary: ["latest bhagalpuri silk sarees"],
    intent: "transactional",
    title: "New Arrivals: Fresh from the Bhagalpur Looms",
    description:
      "The newest sarees off our Bhagalpur looms. Many are one-of-a-kind pieces, so when one sells it is gone.",
    source: "derived",
  },
  {
    cluster: "Bhagalpuri sarees",
    path: "/sarees/zari-bridal",
    primary: "zari silk saree",
    secondary: ["tussar silk bridal saree", "bhagalpuri silk saree for wedding"],
    intent: "transactional",
    title: "Zari & Bridal Silk Sarees from Bhagalpur",
    description:
      "Zari-bordered tussar and silk sarees for weddings, trousseaus and festive gifting, woven in Bhagalpur and sold direct by the makers.",
    source: "derived",
  },
  // Tussar
  {
    cluster: "Tussar",
    path: "/sarees/tussar-silk",
    primary: "tussar silk saree",
    secondary: ["pure tussar silk saree price", "tussar ghicha saree"],
    intent: "transactional",
    title: "Tussar Silk Sarees, Woven in Bhagalpur",
    description:
      "Tussar silk sarees in natural gold and copper hues, woven in Bhagalpur from wild silk. Warp and weft stated on every piece; COD and easy returns.",
    source: "brief",
  },
  {
    cluster: "Tussar",
    path: "/sarees/ghicha-silk",
    primary: "ghicha silk saree",
    secondary: ["ghicha tussar saree price"],
    intent: "transactional",
    title: "Ghicha Silk Sarees with Rustic Texture",
    description:
      "Ghicha sarees woven from tussar yarn hand-drawn without twisting, for an irregular, textured weave. From Bhagalpur looms, sold direct.",
    source: "derived",
  },
  // Raw and matka silk
  {
    cluster: "Raw and matka silk",
    path: "/sarees/raw-silk",
    primary: "raw silk saree",
    secondary: ["bhagalpur raw silk saree", "raw silk saree price"],
    intent: "transactional",
    title: "Raw Silk Sarees, Woven in Bhagalpur",
    description:
      "Raw silk sarees that keep their natural sericin for a crisp, structured drape. Woven in Bhagalpur and sold direct, with full fibre composition.",
    source: "brief",
  },
  {
    cluster: "Raw and matka silk",
    path: "/sarees/matka-silk",
    primary: "matka silk saree",
    secondary: ["matka silk saree price", "bhagalpuri matka silk saree"],
    intent: "transactional",
    title: "Matka Silk Sarees from Bhagalpur",
    description:
      "Matka silk sarees with the slubby texture of yarn spun from pierced mulberry cocoons. Woven in Bhagalpur, sold by the makers, clearly labelled.",
    source: "brief",
  },
  {
    cluster: "Raw and matka silk",
    path: "/fabric/matka-silk",
    primary: "matka silk fabric",
    secondary: ["matka silk fabric per metre", "matka silk fabric online"],
    intent: "transactional",
    title: "Matka Silk Fabric by the Metre",
    description:
      "Matka silk fabric by the metre from Bhagalpur, cut in 0.5 m steps. Order swatches first; boutiques and designers can ask for bulk prices.",
    source: "brief",
  },
  // Fabric by metre
  {
    cluster: "Fabric by metre",
    path: "/fabric",
    primary: "silk fabric by the metre",
    secondary: ["bhagalpur silk fabric", "bhagalpur raw silk fabric"],
    intent: "transactional",
    title: "Silk Fabric by the Metre from Bhagalpur",
    description:
      "Tussar, matka, raw silk, linen-stripe and cotton-silk fabric by the metre, direct from Bhagalpur. Swatch orders and bulk quotes for boutiques.",
    source: "brief",
  },
  {
    cluster: "Fabric by metre",
    path: "/fabric/raw-silk",
    primary: "raw silk fabric per metre",
    secondary: ["bhagalpur raw silk fabric", "raw silk fabric online"],
    intent: "transactional",
    title: "Raw Silk Fabric per Metre, Bhagalpur",
    description:
      "Raw silk fabric per metre with a crisp body for suits, kurtas and jackets. Woven in Bhagalpur, cut in 0.5 m steps, swatches available.",
    source: "brief",
  },
  {
    cluster: "Fabric by metre",
    path: "/fabric/tussar-silk",
    primary: "tussar silk fabric online",
    secondary: ["tussar silk fabric per metre"],
    intent: "transactional",
    title: "Tussar Silk Fabric by the Metre",
    description:
      "Tussar silk fabric in natural gold tones, sold by the metre from Bhagalpur. Cut in 0.5 m steps, with swatches and bulk pricing for boutiques.",
    source: "brief",
  },
  {
    cluster: "Fabric by metre",
    path: "/fabric/linen-stripe",
    primary: "linen stripe fabric",
    secondary: ["linen stripe fabric per metre"],
    intent: "transactional",
    title: "Linen Stripe Fabric by the Metre",
    description:
      "Linen-stripe fabric by the metre, woven in Bhagalpur for shirts, kurtas and home furnishing. Cut in 0.5 m steps; swatches available.",
    source: "brief",
  },
  {
    cluster: "Fabric by metre",
    path: "/fabric/cotton-silk",
    primary: "cotton silk fabric per metre",
    secondary: ["cotton silk fabric online"],
    intent: "transactional",
    title: "Cotton-Silk Fabric by the Metre",
    description:
      "Cotton-silk fabric by the metre from Bhagalpur: lighter than pure silk and easy to wear daily. Composition stated on every listing.",
    source: "derived",
  },
  {
    cluster: "Fabric by metre",
    path: "/fabric/swatches",
    primary: "silk fabric swatches",
    secondary: ["bhagalpur silk swatch"],
    intent: "commercial",
    title: "Silk Fabric Swatches from Bhagalpur",
    description:
      "Order swatches of our tussar, matka, raw silk and linen fabrics to check colour, weight and texture before you buy by the metre.",
    source: "derived",
  },
  // Product type (secondary saree fibres and other sections)
  {
    cluster: "Product type",
    path: "/sarees/cotton-silk",
    primary: "cotton silk saree",
    secondary: ["bhagalpuri cotton silk saree"],
    intent: "transactional",
    title: "Cotton-Silk Sarees from Bhagalpur",
    description:
      "Light cotton-silk sarees for office and everyday wear, woven in Bhagalpur. Blend composition stated clearly on every piece.",
    source: "derived",
  },
  {
    cluster: "Product type",
    path: "/sarees/linen",
    primary: "linen saree",
    secondary: ["bhagalpuri linen saree"],
    intent: "transactional",
    title: "Linen Sarees, Woven in Bhagalpur",
    description:
      "Breathable linen sarees woven in Bhagalpur for warm days and long office hours, sold direct by the makers.",
    source: "derived",
  },
  {
    cluster: "Product type",
    path: "/stoles-dupattas",
    primary: "tussar silk dupatta",
    secondary: ["bhagalpuri silk stole", "bhagalpuri dupatta"],
    intent: "transactional",
    title: "Silk Stoles & Dupattas from Bhagalpur",
    description:
      "Tussar, ghicha and silk-blend stoles and dupattas woven in Bhagalpur, with fibre composition stated on every piece.",
    source: "derived",
  },
  {
    cluster: "Product type",
    path: "/dress-material",
    primary: "bhagalpuri dress material",
    secondary: ["silk suit material online"],
    intent: "transactional",
    title: "Silk Suits & Dress Material from Bhagalpur",
    description:
      "Unstitched silk and silk-blend suit sets and dress material woven in Bhagalpur, sold direct by the makers.",
    source: "derived",
  },
  {
    cluster: "Product type",
    path: "/kurta-fabric",
    primary: "silk kurta fabric for men",
    secondary: ["raw silk kurta fabric", "tussar kurta fabric"],
    intent: "transactional",
    title: "Men's Silk Kurta Fabric from Bhagalpur",
    description:
      "Raw silk, tussar and linen kurta fabric for men, woven in Bhagalpur and sold direct, with the fibre composition stated on every listing.",
    source: "derived",
  },
  {
    cluster: "Product type",
    path: "/home-furnishing",
    primary: "silk furnishing fabric",
    secondary: ["matka silk cushion covers", "tussar silk furnishing"],
    intent: "transactional",
    title: "Silk Home Furnishing from Bhagalpur",
    description:
      "Furnishing fabric and home textiles in matka, ghicha and tussar silk, woven in Bhagalpur and sold direct by the makers.",
    source: "derived",
  },
  // Occasion
  {
    cluster: "Occasion",
    path: "/occasion/office",
    primary: "silk saree for office",
    secondary: ["lightweight silk saree for office"],
    intent: "commercial",
    title: "Silk Sarees for Office Wear",
    description:
      "Lightweight tussar and cotton-silk sarees that drape easily for long working days. Woven in Bhagalpur, with care guides and easy returns.",
    source: "brief",
  },
  {
    cluster: "Occasion",
    path: "/occasion/puja",
    primary: "puja saree",
    secondary: ["durga puja silk saree", "chhath puja saree"],
    intent: "commercial",
    title: "Puja Sarees in Tussar & Silk",
    description:
      "Sarees for Durga Puja, Chhath and family pujas, woven in Bhagalpur in tussar and silk, with clear fibre labels and COD.",
    source: "brief",
  },
  {
    cluster: "Occasion",
    path: "/occasion/gifting",
    primary: "wedding gift saree",
    secondary: ["silk saree gift", "saree gift for mother"],
    intent: "commercial",
    title: "Silk Sarees for Gifting",
    description:
      "Silk sarees to give for weddings, festivals and family milestones, woven in Bhagalpur. Gift wrap and a personal message available at checkout.",
    source: "brief",
  },
  {
    cluster: "Occasion",
    path: "/occasion/wedding",
    primary: "silk saree for wedding",
    secondary: ["bhagalpuri bridal saree", "trousseau silk saree"],
    intent: "commercial",
    title: "Silk Sarees for Weddings & Trousseau",
    description:
      "Zari and silk sarees for brides, wedding guests and trousseau shopping, woven in Bhagalpur and sold direct by the makers.",
    source: "derived",
  },
  {
    cluster: "Occasion",
    path: "/occasion/festive",
    primary: "festive silk saree",
    secondary: ["diwali silk saree", "festive saree online"],
    intent: "commercial",
    title: "Festive Silk Sarees from Bhagalpur",
    description:
      "Tussar, matka and zari sarees for Durga Puja, Diwali and Chhath, woven in Bhagalpur and sold direct at maker's prices.",
    source: "derived",
  },
  // Price
  {
    cluster: "Price",
    path: "/shop/under-3000",
    primary: "silk saree under 3000",
    secondary: ["cotton silk saree under 3000"],
    intent: "commercial",
    title: "Sarees & Fabric Under ₹3,000",
    description:
      "Cotton-silk and linen sarees, stoles and fabric from Bhagalpur under ₹3,000, every piece with its fibre composition stated.",
    source: "derived",
  },
  {
    cluster: "Price",
    path: "/shop/3000-to-7000",
    primary: "pure silk saree under 7000",
    secondary: ["tussar silk saree under 5000"],
    intent: "commercial",
    title: "Silk Sarees from ₹3,000 to ₹7,000",
    description:
      "Tussar, matka and raw silk sarees from ₹3,000 to ₹7,000: premium Bhagalpur weaving at maker's prices, with no middleman.",
    source: "derived",
  },
  {
    cluster: "Price",
    path: "/shop/above-7000",
    primary: "premium silk saree",
    secondary: ["bhagalpuri zari saree"],
    intent: "commercial",
    title: "Premium Silk Sarees Above ₹7,000",
    description:
      "Zari, bridal and finely woven silk sarees above ₹7,000 from the looms of Bhagalpur, each piece credited to its weaver where known.",
    source: "derived",
  },
  // Education (top of funnel)
  {
    cluster: "Education",
    path: "/guides/how-to-verify-silk-mark",
    primary: "how to identify pure silk",
    secondary: ["silk mark meaning", "silk mark verification"],
    intent: "informational",
    title: "How to Identify Pure Silk and Verify Silk Mark",
    description:
      "What the Silk Mark label means, how to check its number with the Silk Mark Organisation of India, and simple ways to tell pure silk from blends.",
    source: "brief",
  },
  {
    cluster: "Education",
    path: "/guides/silk-types-explained",
    primary: "tussar vs mulberry silk",
    secondary: ["what is matka silk", "what is ghicha silk", "raw silk vs pure silk"],
    intent: "informational",
    title: "Tussar, Ghicha, Matka and Raw Silk Explained",
    description:
      "How tussar, ghicha, matka and raw silk differ in yarn, texture and drape, and how each compares with mulberry silk.",
    source: "brief",
  },
  {
    cluster: "Education",
    path: "/guides/bhagalpur-silk-guide",
    primary: "bhagalpur silk",
    secondary: [
      "bhagalpuri silk",
      "bhagalpur silk gi tag",
      "bhagalpur silk history",
      "how to identify original bhagalpuri silk",
      "best silk in bhagalpur",
    ],
    intent: "informational",
    title: "Bhagalpur Silk Guide: Bhagalpuri Sarees, GI Tag & How to Buy",
    description:
      "What Bhagalpur silk is, the yarns woven in India's Silk City, the 2013 GI tag, and how to tell an original Bhagalpuri silk saree from a copy.",
    source: "derived",
  },
  {
    cluster: "Education",
    path: "/guides/saree-care",
    primary: "how to wash silk saree",
    secondary: ["silk saree care", "how to store silk sarees"],
    intent: "informational",
    title: "Silk Saree Care: Washing, Storing & Ironing",
    description:
      "How to clean, iron, fold and store tussar, matka and raw silk sarees so the sheen and colour last for years.",
    source: "derived",
  },
  // Local and brand
  {
    cluster: "Local and brand",
    path: "/contact",
    primary: "silk shop in bhagalpur",
    secondary: ["bhagalpur silk market", "silk saree shop in bhagalpur", "best silk in bhagalpur"],
    intent: "local",
    title: "Visit or Contact Our Bhagalpur Silk Shop",
    description:
      "Visit Bahram Raw Silk at Hossainabad, Bounsi Road, Bhagalpur, or reach us by phone, WhatsApp or email about sarees, silk fabric and bulk orders.",
    source: "brief",
  },
  {
    cluster: "Local and brand",
    path: "/",
    primary: "bahram silks",
    secondary: ["bahram raw silk", "bahram silk bhagalpur", "bhagalpur silk", "bhagalpuri silk"],
    intent: "navigational",
    title: "Bahram Silks | Bhagalpur Silk Sarees & Fabric from the Looms",
    description:
      "Bahram Raw Silk, Bhagalpur: makers of tussar, matka and raw silk sarees and fabric by the metre. Original Bhagalpuri silk, shipped across India.",
    source: "brief",
  },
];

const byPath = new Map(KEYWORD_MAP.map((target) => [target.path, target]));

/** Keyword target for a landing page path (query string ignored), if one is mapped. */
export function keywordTargetFor(path: string): KeywordTarget | undefined {
  const pathname = path.split("?")[0] ?? path;
  const normalised = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return byPath.get(normalised);
}
