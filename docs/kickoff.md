# Bahram Silks — E-commerce Platform: Deep-Research Kickoff Document

Oct 31, 2026 · @junaid

## Executive summary

Bahram Silks should launch as the authentic, maker-direct home of Bhagalpur silk online: an elegant D2C store plus a full admin panel, live in about 16 weeks, selling pan-India. No brand currently owns "Bhagalpur silk" online; Bhagalpur pieces are either a side collection in large stores or sold cheaply on marketplaces with weak proof of authenticity.

**Key recommendations**

1. **Win on proof.** Show Silk Mark and Handloom Mark label numbers, GI eligibility, exact fibre composition and weaver credit on every product. Start both registrations in week 1: the Handloom Mark is proposed to become mandatory for anything sold as "handloom".
2. **Price in the middle, quality at the top.** Sell premium-quality pieces at ₹3,800–₹7,000 mid-band prices, which the maker-direct model allows, with a zari and bridal tier above.
3. **Sell sarees and fabric.** Add raw silk, tussar, matka and linen fabric by the metre as a second line for consumers, boutiques and designers.
4. **Build on free, open-source tools: Next.js on Vercel with Supabase.** One codebase holds the storefront and the admin panel; Supabase provides Postgres, auth and image storage on its Free plan. Vercel's free Hobby plan is non-commercial only, so keep payments in test mode until the project moves to a paid or commercial-friendly host.
5. **SEO from sprint one.** Server-rendered pages, structured data, a keyword map around Bhagalpuri, tussar, raw and matka silk, and pillar guides that become the web's best reference on the craft.
6. **Protect margin on COD.** UPI-first checkout, prepaid incentives, COD limits and WhatsApp confirmation, because COD orders return at roughly ten times the prepaid rate.
7. **Design compliance in.** E-commerce rule amendments take effect 1 January 2027 and DPDP duties by 13 May 2027; build price history, consent logs and grievance handling now.

**First decisions needed:** launch product mix, target festival date and budget. The full list is under Open questions at the end.

## Product & heritage

Bahram Silks sells a GI-protected craft, and authenticity is the single strongest selling point the website can make. Bhagalpur silk received its Geographical Indication certificate on 15 January 2013, held by the Bhagalpur Tussar Silk Development Samiti at the Weavers' Service Centre ([Krafteria](https://krafteria.com/sv/blogs/news/bhagalpur-silk-bhagalpuri-tussar-silk-silk-craft-of-bihar), [MAP Academy](https://mapacademy.io/?p=3112)). Some sites quote 2009 or 2012; use 2013 in all copy.

**The cluster.** Bhagalpur, the "Silk City", has roughly 30,000 handloom weavers on about 25,000 looms ([Wikipedia](https://en.wikipedia.org/wiki/Bhagalpur_sari)). Key weaving localities include Nathnagar, Champanagar, Mirzafari, Aliganj, Puraini, Dariapur and Sheikhpura ([Gaatha](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7)). The trade is under pressure: The Hindu reported tussar yarn prices rising steeply and weaver numbers falling ([The Hindu via PressReader](https://www.pressreader.com/india/the-hindu-international-9BN2/20240318/281638195187629)), and Ganga floods hit weaving units in September 2026 ([ETV Bharat](https://www.etvbharat.com/en/videos/bhagalpur-silk-city-comes-to-a-halt-as-ganga-floods-inundate-weaving-units-enn26091102689)). A weaver-first story is both true and marketable.

**Possible existing footprint.** A B2B directory lists "Bahram Raw Silk" in Bhagalpur as a manufacturer and wholesaler of raw silk, matka, tussar, cotton-silk and linen-stripe fabric since 1948 ([TextileInfomedia](https://www.textileinfomedia.com/bahram-raw-silk)). If this is the client, the 1948 heritage is a major brand asset; confirm the link with the client.

### Fibre and fabric glossary for the catalogue

These terms will become product filters, SEO landing pages and buyer-education content.

| Term | What it is | Look and feel | Typical products |
| --- | --- | --- | --- |
| Tussar (tasar) | Wild silk from the indigenous Antheraea mylitta silkworm, fed on forest trees ([MAP Academy](https://mapacademy.io/?p=3112)) | Natural gold/copper hue, slightly coarse, matte sheen | Sarees, stoles, dupattas, fabric |
| Raw silk | Silk that still carries its natural gum, sericin ([Fibre2Fashion](https://www.fibre2fashion.com/industry-article/2424/indian-silk-for-fashion-apparels)) | Firmer, crisper body than degummed silk | Sarees, suit fabric, kurtas |
| Ghicha | Tussar yarn hand-drawn from cocoons without twisting ([My Textile Notes](https://mytextilenotes.blogspot.com/2026/05/silk-fabric-terms-explained-part-5.html)) | Irregular, rustic, textured | Sarees, dress material, furnishing |
| Matka | Hand-spun yarn from pierced or waste mulberry cocoons; not the same as raw silk ([My Textile Notes](https://mytextilenotes.blogspot.com/2026/05/silk-fabric-terms-explained-part-5.html)) | Rough, slubby, thick | Sarees, jackets, suits, furnishing |
| Katiya, Jhuri, Danti, Balkal | Local Bhagalpur names for spinning stages and yarn types ([Gaatha](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7)) | Varies by yarn | Blended fabrics |
| Eri, Mulberry, Noil | Other silks woven in the cluster ([Gaatha](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7)) | Eri: soft, cotton-like; Mulberry: smooth, lustrous | Shawls, sarees, fabric |

Tussar and matka together account for over half of the cluster's output ([Gaatha](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7)), so these two should lead the navigation.

### Authenticity signals to build into the site

- **Silk Mark.** Issued by the Silk Mark Organisation of India under the Central Silk Board ([Vikaspedia](https://en.vikaspedia.in/viewcontent/indian-silk/silk-mark-organisation-of-india-smoi-/silk-mark-organisation-of-india?lgn=en)). Each hang-tag or sew-in label carries a hologram and unique number traceable to the authorised user. Only registered authorised users may attach it ([Sacred Weaves](https://www.sacredweaves.com/blogs/news/what-is-silk-mark-certification)). Recommendation: Bahram becomes an authorised user, and every pure-silk product page shows its label number with a link to verification on silkmarkindia.com.
- **GI tag.** Claim "Bhagalpur Silk (GI)" only for products that qualify; the Weavers' Service Centre noted that GI certification requires the traditional process for both sourcing and weaving ([inkl / The Hindu](https://inkl.com/news/in-bihar-s-bhagalpur-weavers-face-a-silk-slub)).
- **Honest composition labels.** State fibre per warp and weft (for example, "tussar warp, ghicha weft" or "cotton-silk blend"). Blends sold as pure silk are the market's biggest trust problem, so clarity here is a differentiator.

## Market & audience

The Indian saree market is worth roughly USD 6 billion and growing about 6–7% a year, and most ethnic wear is now sold online. IMARC values it at USD 5.76 billion in 2024, rising to about USD 10.3 billion by 2033 ([IMARC summary](https://sites.google.com/view/indiamarketresearchreports/india-saree-market)). Redseer reports that about 70% of ethnic wear is available online, and festive-season e-commerce (26 Sep–6 Oct 2025) passed ₹54,500 crore, led by ethnic wear and tier-2 and rural demand ([IndieHaat citing Redseer](https://indiehaat.com/blogs/artisan-news/indian-ethnic-wear-online-sees-boost-from-festive-season-demand)). Over 50 digital-first saree brands now target 18–45 year olds ([DFU Publications](https://dfupublications.com/index.php/news/apparel?start=65)).

### Price bands seen online today

The market splits into three bands. Bahram's direct-from-the-loom position lets it sell premium-quality pieces in the middle band, which is where it should aim to win.

| Band | Typical price per saree | Who sells there | What buyers get |
| --- | --- | --- | --- |
| Mass | ₹750–₹2,200 | Flipkart sellers, weaver SHGs, B2B wholesalers ([Flipkart](https://www.flipkart.com/govind-handloom-solid-plain-bollywood-jute-silk-saree/p/itmb755f8cffe4fb), [India Handmade](https://www.indiahandmade.com/catalog/product/view/id/23870), [Dial4Trade](https://www.dial4trade.com/bhagalpur/zari-border-saree.htm)) | Often blends or "Bhagalpuri" in name only; thin photos and copy |
| Mid | ₹3,800–₹7,000 | Nalli, government emporiums, India Handmade ([Nalli](https://www.nalli.com/collections/bhagalpuri-tussar)) | Trusted names, but Bhagalpur is one small collection among many |
| Premium | ₹10,000–₹26,000 | Curated designer-weaver labels ([Parisera](https://parisera.com/collections/bhagalpuri-sarees)) | Strong storytelling and styling, high mark-ups over the weaver's price |

### Buyer personas

| Persona | Who | Buys for | What wins them |
| --- | --- | --- | --- |
| The working professional | Women 28–45 in metros and tier-2 cities | Office wear, festivals, gifting | Lightweight tussar and cotton-silk, clear care guides, quick delivery, easy returns |
| The craft connoisseur | 35–60, values handloom and sustainability | Collecting, special occasions | Weaver stories, Silk Mark and GI proof, fibre detail |
| The wedding and festive shopper | Families buying for Durga Puja, Chhath, Diwali, weddings | Trousseau and gifting, often several pieces | Zari and bridal ranges, bundles, gift packaging, COD |
| The fabric buyer | Boutiques, tailors, designers, home-décor stores | Fabric by the metre, dress material, furnishing | Swatch orders, metre pricing, bulk and B2B quotes |
| The diaspora buyer (phase 2) | NRIs in the US, UK, UAE, Singapore, Australia | Festivals and weddings abroad | International shipping, USD/GBP pricing, video calls |

The calendar matters as much as the persona: plan stock, campaigns and site banners around Durga Puja, Diwali, Chhath, the winter wedding season and National Handloom Day (7 August).

## Competitive landscape

No single brand owns "Bhagalpur silk" online the way Sacred Weaves or Golghar own Banarasi silk, which is the opening for Bahram Silks. Bhagalpur pieces are sold either as one small collection inside large multi-craft stores, or cheaply on marketplaces with weak authenticity proof.

| Competitor | Type | Strength | Gap Bahram can exploit |
| --- | --- | --- | --- |
| [Nalli](https://www.nalli.com/collections/bhagalpuri-tussar) | National saree house, founded 1928, 15,000+ online SKUs ([DFU](https://dfupublications.com/index.php/news/apparel/six-yards-infinite-possibilities-the-business-of-the-modern-indian-sari)) | Trust, reach, visual AI search | Bhagalpur is a side collection; no weaver or cluster story |
| [Parisera](https://parisera.com/collections/bhagalpuri-sarees) | Curated multi-weaver D2C since 2014 | Premium styling, weaver-label credits | ₹10k+ pricing; reseller, not the maker |
| [India Handmade](https://www.indiahandmade.com/catalog/product/view/id/23807) | Government-backed artisan marketplace | GI messaging, low prices | Generic templates, inconsistent photos |
| [Gaatha](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7) | Craft-story marketplace | Excellent cluster storytelling | Small Bhagalpur range |
| Amazon and Flipkart sellers | Marketplaces, including Amazon's Silk Mark store ([Amazon press](https://press.aboutamazon.com/in/2020/11/amazon-india-inks-mou-with-silk-mark-organisation-of-india)) | Traffic, COD, fast delivery | Price wars; blends mislabelled as silk; no brand loyalty |
| [Bhashabharat](https://yourstory.com/2019/08/startup-bharat-bhagalpur-based-bhashabharat-ecommerce-saree) | Bhagalpur-based handloom e-commerce, since 2017 | Local sourcing | Small weaver network; multi-region focus |
| Banarasi analogues: [Golghar](https://ts.yourstory.com/smbstory/d2c-banaras-saree-brand-golghar-org), [Sacred Weaves](https://www.sacredweaves.com/blogs/news/what-is-silk-mark-certification) | Legacy weaving houses turned D2C | Silk Mark, Indian Handloom Brand logo, WhatsApp video shopping | Not Bhagalpur: the model to copy, not a direct rival |

Golghar is a useful warning: its 1966 B2B family business went through four failed website attempts before its D2C store worked ([YourStory](https://ts.yourstory.com/smbstory/d2c-banaras-saree-brand-golghar-org)). The lesson is to scope tightly and launch with operations ready, not just a pretty site.

### How Bahram Silks wins

1. **Own the category name.** Be the brand that ranks for "Bhagalpuri silk saree", "tussar silk saree", "matka silk" and "Bhagalpur raw silk fabric", with the deepest educational content on the web.
2. **Proof on every product.** Silk Mark label number, GI eligibility, fibre composition, weaver or loom credit and a short unedited video of the actual piece.
3. **Maker's price.** As a Bhagalpur manufacturer, sell premium-quality pieces at mid-band prices, saying openly that there is no middleman.
4. **Sarees plus fabric.** Few rivals sell Bhagalpur fabric by the metre to consumers and boutiques. Bahram's raw silk, matka and linen yardage can be a second, high-intent line.
5. **Human selling.** WhatsApp and video-call shopping, as Sacred Weaves does, to close high-value orders and build repeat buyers.

## Brand identity

The brand is advertised only as **Bahram Silks**: one name, one mark, used everywhere. Position it as "the weaving house of Bhagalpur": a maker, not a reseller, selling authentic tussar, raw and matka silk directly from its own looms.

**Brand promise (draft):** *Woven in Bhagalpur. Certified pure. Sold by the hands that made it.*

**Tone of voice:** warm, knowledgeable and quietly confident. Explain the craft plainly, never over-claim, and credit weavers by name where they agree.

### Logo direction

Commission three concepts before choosing one. Each needs a full wordmark, a compact monogram and a single-colour version that works on a hang-tag, stitched label and favicon.

| Concept | Idea | Why it fits |
| --- | --- | --- |
| A. The cocoon monogram | A "B" drawn from one continuous thread looping into a tussar cocoon | Ties the name to the raw material; reads well at small sizes |
| B. The Ganga loom | A warp-and-weft grid whose weft lines ripple like the Ganga at Bhagalpur | Place-rooted; nods to the river city without clichés |
| C. Heritage seal | A circular seal with "Bahram Silks · Bhagalpur" and the founding year | Signals legacy and authenticity; works as a wax-seal sticker on packaging |

The founding year belongs in Concept C only once confirmed (see the 1948 directory listing above). Avoid any shape resembling the Silk Mark cocoon, the Handloom Mark or the India Handloom Brand logo: the Handloom Mark is a registered certification trade mark ([Fashion Value Chain](https://fashionvaluechain.com/?p=57607)), and look-alikes are prohibited under the draft labelling regulations ([ELP](https://elplaw.in/wp-content/uploads/2026/03/ELP-Trade-Update-New-Marking-Requirements-for-Handlooms-Key-Features-and-Implications-for-Stakeholders.pdf)).

### Visual system

| Element | Recommendation |
| --- | --- |
| Primary colours | Tussar gold (natural silk), deep madder red, ivory |
| Secondary colours | Indigo, leaf green, charcoal; drawn from the reds, blues, pinks and oranges typical of Bhagalpuri dyeing ([MAP Academy](https://mapacademy.io/?p=3112)) |
| Typography | A high-contrast serif for headings (e.g. Cormorant Garamond or Playfair Display); a clean sans for body and UI (e.g. Inter or Manrope); a matching Devanagari face (e.g. Tiro Devanagari Hindi, Mukta) for Hindi pages |
| Motifs | Stripes and checks of varying density, the hallmark of Bhagalpuri fabric ([MAP Academy](https://mapacademy.io/?p=3112)); kalash and peepal-leaf motifs ([Indian Textile Journal](https://indiantextilejournal.com/?p=2544201)); thin zari-style borders as section dividers |
| Photography | Daylight, true colour, the texture visible at 100% zoom; every saree shown flat, draped, pallu close-up, border close-up and on a model |
| Video | 10–20 second reels of the actual piece in daylight, plus loom and weaver films for brand pages |

### Brand asset checklist

- [x] Confirm the spelling (Bahram) and the founding year
- [ ] Trademark search and filing with IP India for "Bahram Silks" word and logo, in classes 24 (textiles), 25 (clothing) and 35 (retail)
- [ ] Register the domain (bahramsilks.com / .in) and matching Instagram, Facebook, YouTube, Pinterest and WhatsApp Business handles
- [ ] Logo suite: primary, monogram, single-colour, reversed, favicon, app icon
- [ ] Brand guidelines PDF: colours, type, spacing, do's and don'ts
- [ ] Packaging: saree box, cloth pouch, tissue, seal sticker, care card, authenticity card with Silk Mark/Handloom Mark numbers, thank-you note
- [ ] Swing tag and stitched woven label
- [ ] Invoice, shipping label and packing-slip templates (GST-compliant)
- [ ] Social templates: product post, reel cover, story, festive campaign
- [ ] Email templates: order confirmation, shipped, delivered, abandoned cart, review request
- [ ] Lookbook and catalogue (PDF) for B2B and boutique buyers

## Storefront UX & design

Design mobile-first, and make the fabric the hero: big true-colour imagery, generous ivory space and restrained gold detailing, with proof of authenticity always one glance away.

### Information architecture

Shop menus by product, fabric, occasion and price, so every common search intent has a crawlable landing page.

- **Sarees:** Tussar, Raw silk, Matka, Ghicha, Cotton-silk, Linen, Zari and bridal, New arrivals
- **Fabrics by the metre:** Raw silk, Tussar, Matka, Linen stripe, Cotton-silk; swatch orders
- **Stoles and dupattas, Suits and dress material, Men's kurta fabric, Home furnishing** (as the range allows)
- **Shop by occasion:** Office, Festive, Wedding, Puja, Gifting
- **Shop by price:** under ₹3,000, ₹3,000–₹7,000, ₹7,000+
- **The craft:** Our story, Our weavers, Bhagalpur silk guide, Silk types explained, Care guide, Journal (blog)
- **Help:** Shipping, Returns and exchanges, Track order, FAQ, Contact and WhatsApp, Bulk and boutique enquiries

### Key pages and must-have features

| Page | Must have |
| --- | --- |
| Home | Hero film or still of the loom, seasonal campaign, shop-by-fabric tiles, "Why Bahram" proof strip (Silk Mark, GI, handloom, direct from weaver), bestsellers, reviews, Instagram feed |
| Collection | Filters for fabric, colour, occasion, price, weave, zari, blouse included; sort; 2-column mobile grid; SEO intro text at top and FAQ at bottom |
| Product | 6–8 photos plus video, zoom, fibre composition, length (5.5 m + 0.8–1 m blouse is common; [Dial4Trade](https://www.dial4trade.com/bhagalpur/zari-border-saree.htm)), weight, care, Silk Mark/Handloom Mark number, weaver credit, delivery-date estimate by PIN code, COD availability, WhatsApp "ask about this saree", reviews with photos |
| Fabric product | Price per metre, quantity stepper in 0.5 m steps, swatch add-on, bulk-price tiers |
| Cart and checkout | Guest checkout, OTP login, address autofill from PIN code, UPI first, coupon field, gift wrap and message, clear total with GST and shipping |
| Account | Orders, tracking, returns, wishlist, addresses, loyalty points |
| Craft pages | Long-form, photo-led stories that double as SEO pillars |

### Design-system principles

- Build components once (buttons, cards, filters, drawers, badges, price, rating) as a token-driven system, so the storefront and admin share colours, type and spacing.
- Use Bhagalpuri stripe and check patterns sparingly, as borders and section dividers, never behind text.
- Hindi language toggle in phase 2; plan i18n-ready routes and copy keys from day one.
- Accessibility to WCAG 2.2 AA: contrast on gold text, alt text on every image, keyboard-usable filters and gallery.

### Performance targets

Speed is a ranking and conversion factor, and many buyers will be on mid-range Android phones and patchy 4G.

| Metric | Target (mobile, 75th percentile) |
| --- | --- |
| Largest Contentful Paint | ≤ 2.5 s |
| Interaction to Next Paint | ≤ 200 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| Product-page JavaScript | ≤ 150 KB compressed |

Serve images as AVIF/WebP from an image CDN with responsive sizes, keep the full-resolution zoom images lazy-loaded, and stream server-rendered pages.

## SEO & marketing strategy

The SEO goal is to own every "Bhagalpur", "tussar", "raw silk" and "matka" search, then turn that traffic into repeat buyers through WhatsApp, email and Instagram. SEO is built into the platform from sprint one, not added after launch.

### Technical SEO (built into the platform)

- Server-rendered or statically generated pages, clean URLs (`/sarees/tussar-silk/`, `/fabric/matka-silk/`), canonical tags on filtered and sorted views, and `noindex` on thin filter combinations.
- XML sitemaps split by products, collections and articles; automatic updates when admins publish.
- Editable SEO title, meta description, slug, Open Graph image and alt text for every product, collection and page in the admin.
- JSON-LD structured data: `Organization`, `WebSite` with search, `BreadcrumbList`, `Product` with `Offer` (price, INR, availability), `AggregateRating` and `Review`, `ProductGroup` for colour variants, `Article` and `FAQPage` where visible. Include `shippingDetails` and `hasMerchantReturnPolicy`; Google Merchant listings use them, and policies can also be set in Search Console or Merchant Center ([Pemavor](https://www.pemavor.com/?p=28384), [Shopify Community](https://community.shopify.com/t/how-to-fix-search-consol-hasmerchantreturnpolicy-and-shippingdetails-missing-issue/252294)).
- 301 redirect manager in the admin, so renamed products never leave dead links.
- Core Web Vitals targets as set in the storefront section.
- Hindi pages (phase 2) with `hreflang` tags.

### Keyword clusters

Validate volumes and difficulty in Semrush or Ahrefs before writing; both have connectors available in Claude if you want to pull the data here.

| Cluster | Example queries | Landing page |
| --- | --- | --- |
| Bhagalpuri sarees | bhagalpuri silk saree, bhagalpuri saree online, original bhagalpuri saree | /sarees/bhagalpuri-silk/ |
| Tussar | tussar silk saree, pure tussar silk saree price, tussar ghicha saree | /sarees/tussar-silk/ |
| Raw and matka silk | raw silk saree, matka silk saree, matka silk fabric | /sarees/raw-silk/, /fabric/matka-silk/ |
| Fabric by metre | raw silk fabric per metre, tussar silk fabric online, linen stripe fabric | /fabric/ collections |
| Occasion | silk saree for office, puja saree, wedding gift saree | /occasion/… |
| Education (top of funnel) | how to identify pure silk, tussar vs mulberry silk, what is matka silk, silk mark meaning | /journal/… pillar articles |
| Local and brand | silk shop in bhagalpur, bhagalpur silk market, bahram silks | Store page, Google Business Profile |

### Content plan

1. **Pillar guides** (2,000+ words, original photos): The Bhagalpur Silk Guide; Tussar, Ghicha, Matka and Raw Silk Explained; How to Verify Silk Mark; Saree Care.
2. **Weaver stories:** one short film and article a month, building authority and earned links.
3. **Collection copy:** 150–300 unique words per collection, plus 4–6 FAQs.
4. **Product copy:** unique descriptions only; never paste supplier or marketplace text.
5. **Digital PR:** pitch the GI, flood-recovery and weaver stories to fashion, craft and Bihar media for backlinks.

### Channels beyond organic search

| Channel | Role | First actions |
| --- | --- | --- |
| Google Merchant Center | Free product listings and Shopping ads | Product feed from the admin; Performance Max once 30+ conversions |
| Google Business Profile | Local trust and "near me" searches in Bhagalpur | Verify the shop, add photos, collect reviews |
| Instagram and Facebook | Discovery and brand | Daily reels of drapes and looms; catalogue-tagged posts; Meta Advantage+ catalogue ads |
| WhatsApp Business | Conversion and repeat sales | Catalogue, broadcast lists for new drops, video-call shopping |
| YouTube and Pinterest | Evergreen discovery | Weaving films, draping tutorials, rich pins |
| Influencers | Trust with 25–45 women | 10–20 micro-creators per festive season, paid in product plus fee |
| Marketplaces | Extra reach, phase 2 | Amazon (Silk Mark store) and Flipkart with a curated range; keep best pieces site-exclusive |
| Email and SMS | Retention | Welcome series, abandoned cart, back-in-stock, festive drops |

### Launch campaign

Time the public launch three to four weeks before a festival peak, with a pre-launch waitlist, a "founders' collection" of numbered pieces, a launch film from the looms, and an influencer seeding wave.

## Admin panel scope

The admin panel is the business's daily operating system: every product, price, page, order, return, customer and report is managed there, by staff with role-based access. MVP modules ship at launch; the rest follow in phase 2.

| Module | Capabilities | Phase |
| --- | --- | --- |
| Dashboard | Today's orders, revenue, COD vs prepaid, pending shipments, low stock, returns awaiting action, top products | MVP |
| Catalogue | Products and variants (colour, length, blouse option); fabric products sold per metre; attributes (fibre, weave, zari, weight, care); bulk CSV import/export; media library with image optimisation and video; SEO fields; draft, scheduled and published states | MVP |
| Authenticity | Silk Mark and Handloom Mark label numbers per piece; weaver and loom record; GI eligibility flag; label-usage log for audits | MVP |
| Inventory | Stock per SKU and location (shop, warehouse, with weaver); one-of-a-kind pieces as quantity 1; fabric stock in metres; reservations during checkout; low-stock alerts; stock adjustments with reasons | MVP |
| Orders | Full order lifecycle (diagram below); COD confirmation calls or WhatsApp; split shipments; notes; invoices and credit notes; manual and phone orders | MVP |
| Shipping | Courier aggregator integration: rates, label printing, pickup scheduling, tracking sync, NDR (non-delivery) handling, RTO tracking | MVP |
| Returns and exchanges | Request approval, reverse pickup, quality check, refund to source or store credit, restock or write-off | MVP |
| Customers | Profiles, order history, addresses, tags (VIP, boutique, wholesale), notes, consent records | MVP |
| Content (CMS) | Home page sections, banners, collections, lookbooks, blog/journal, static pages, navigation menus, announcement bar, redirects | MVP |
| Promotions | Coupons (percentage, flat, free shipping), automatic offers, bundle pricing, festive sale scheduling, gift cards | MVP (basic), phase 2 (advanced) |
| Reviews | Moderation, photo reviews, reply, request emails | MVP |
| Reports | Sales by day, product, fabric, channel; GST reports (B2C, B2B, HSN summary); COD reconciliation; returns; inventory valuation; abandoned carts | MVP (core), phase 2 (advanced) |
| B2B and wholesale | Price lists, minimum order quantities, quote requests, GSTIN capture, credit terms | Phase 2 |
| Marketplace sync | Amazon and Flipkart listing and stock sync | Phase 2 |
| Loyalty and referral | Points, tiers, referral codes | Phase 2 |
| Settings and roles | Staff accounts and permissions (Owner, Manager, Catalogue editor, Fulfilment, Support, Accountant); audit log; tax, shipping zones, payment and notification settings; two-factor login | MVP |

&#91;embedded content: order lifecycle · 12 states managed in the admin\]

Each state change triggers a customer message and an admin task; failed deliveries get a reattempt before going back to origin, and returned or RTO pieces pass quality check before they are restocked.

One-of-a-kind handloom pieces need special care: reserve stock when checkout starts (not at add-to-cart), release it automatically if payment is not completed within about 15 minutes, and commit it on payment or COD confirmation, so the same saree is never sold twice.

## Technical architecture & stack

Decision: one **Next.js app (App Router, TypeScript) hosted on Vercel, with Supabase** as database, auth and file storage, built only on free tiers and open-source libraries. The storefront and the admin panel live in the same codebase, so there is no separate commerce server to host or pay for. Medusa was considered and dropped: it needs an always-on server and Redis that free tiers do not cover.

### Free, open-source stack

| Layer | Choice | Licence and cost |
| --- | --- | --- |
| Storefront | Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui (Radix) | Open source (MIT); free |
| Admin panel | `/admin` routes in the same app; TanStack Table, React Hook Form + Zod, Recharts, Tiptap editor | Open source (MIT); free |
| Database | Supabase Postgres with Row Level Security; migrations and local dev with the Supabase CLI | Supabase is open source; Free plan |
| Auth | Supabase Auth: email OTP for shoppers; role claims for staff (owner, manager, fulfilment, support) | Free plan, 50,000 monthly active users |
| Images and files | Supabase Storage; images converted to WebP in two or three sizes on upload with sharp | Free plan, 1 GB storage |
| Search | Postgres full-text search plus pg\_trgm for typo tolerance | Built in; no Meilisearch or Algolia needed |
| Background jobs | Supabase pg\_cron (release unpaid stock reservations, nightly summaries); Vercel Cron for daily tasks | Free |
| Content | CMS tables in Supabase for banners, pages and lookbooks; MDX files in the repo for journal articles | Free |
| Email | Nodemailer (open source) over a free SMTP tier such as Brevo, or Resend's free tier | Free tier; the email service itself is not open source |
| Payments | Razorpay Checkout: test mode is free; live mode charges 2% + GST per transaction, no fixed fee ([Razorpay](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)) | No monthly cost; per-sale fee unavoidable once live |
| Shipping | Book couriers manually at first; add a Shiprocket API integration later | Pay per shipment |
| Messaging | WhatsApp click-to-chat links and the free WhatsApp Business app | Free; paid WhatsApp API deferred |
| SEO | Next.js Metadata API, `sitemap.ts`, `robots.ts`, JSON-LD components | Free |
| Analytics | GA4, Search Console, Microsoft Clarity | Free |
| Quality | GitHub Actions, Vitest, Playwright, ESLint, Prettier | Free |

### Free-tier limits and how the design copes

| Limit | Risk | Mitigation |
| --- | --- | --- |
| Vercel Hobby is for personal, non-commercial use only; commercial use needs Pro ([Vercel](https://vercel.com/docs/limits/fair-use-guidelines)) | Taking real orders would breach the Hobby terms | Keep Razorpay in test mode while on Hobby; before live sales, move to Vercel Pro or a host whose free tier allows commercial use |
| Supabase Free pauses projects after 7 days of inactivity ([JetAdmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)) | Site goes down and wakes slowly | Regular traffic keeps it active; upgrade before live sales |
| 500 MB database per project | Fills with logs and carts | No images or blobs in Postgres; purge abandoned carts and old logs with pg\_cron |
| 1 GB file storage, 5 GB egress | Product photos are the biggest consumer | About 150 KB per WebP image and 6–8 images per product is roughly 1 MB per product, so around 800–900 products fit; long cache headers to cut egress |
| No daily backups on Free ([DEV Community](https://dev.to/mahdi_benrhouma_fe1c6005/supabase-free-tier-limits-in-2026-what-you-actually-get-and-when-you-will-hit-them-4mhe)) | Data loss | Weekly `pg_dump` via GitHub Actions to private storage |
| Two active free projects per organisation | No room for many environments | One project for production, one for staging; develop locally with the Supabase CLI |

&#91;embedded content: platform architecture · front ends, Medusa backend, data stores, integrations\]

Shoppers and staff use the same Next.js app; its server actions read and write Supabase and call out to payments, couriers and analytics.

## Legal & compliance in India

Bahram Silks will be an *inventory e-commerce entity* (it sells its own stock), and three rule changes land within the project window: tighter e-commerce rules from 1 January 2027, DPDP data-protection duties by 13 May 2027, and a proposed mandatory Handloom Mark. Build compliance into the platform now rather than retrofitting it. This section is research, not legal advice; confirm each item with a lawyer and chartered accountant.

| Area | What applies | What the platform must do | Status |
| --- | --- | --- | --- |
| Consumer Protection (E-Commerce) Rules, 2020 | Seller identity, grievance officer, total price with charges, return and refund terms, product details ([IndiaLaw](https://www.indialaw.in/blog/civil/consumer-protection-e-commerce-rules/pdf/), [Mondaq](https://www.mondaq.com/india/dodd-frank-consumer-protection-act/995148/the-consumer-protection-e-commerce-rules-2020)) | Footer legal entity and address; grievance-officer page; complaint acknowledgement within 48 hours and resolution within one month ([Mondaq](https://www.mondaq.com/india/consumer-law/1845298/rethinking-e-commerce-compliance-key-changes-under-the-consumer-protection-e-commerce-amendment-rules-2026)) | In force |
| E-Commerce (Amendment) Rules, 2026 | Discounts must show the reduced and the "prior price"; dark-pattern guidelines become mandatory with a yearly self-audit and displayed certificate ([ETV Bharat/PTI](https://www.etvbharat.com/en/business/govt-amends-e-commerce-rules-to-check-price-manipulation-dark-patterns-fake-sponsored-listings-enn26091005812), [Retail Insight Network](https://www.retail-insight-network.com/newsletters/india-tightens-e-commerce-rules)) | Admin stores a genuine price history for "compare-at" prices; no fake timers, pre-ticked add-ons or hidden charges | From 1 Jan 2027 ([Business Standard](https://www.business-standard.com/industry/news/online-shopping-to-get-stricter-consumer-rules-on-pricing-rankings-in-2027-126091400371_1.html)) |
| Dark Patterns Guidelines, 2023 | 13 named dark patterns banned, including drip pricing and false urgency ([PIB](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/mar/doc2025314520301.pdf)) | UX review checklist before launch; shipping and COD fees visible on product and cart | In force |
| DPDP Act 2023 and Rules 2025 | Notice and consent, security safeguards, breach reporting, data-principal rights; rules notified 13 Nov 2025 ([JSA](https://www.jsalaw.com/wp-content/uploads/2025/11/JSA-Prism-InfoTech-November-2025-DPDP-Rules.Final_.pdf)) | Standalone privacy notice; separate opt-in for marketing; withdrawal as easy as giving consent ([KPMG](https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/11/dpdp-rules-2025-guidance-to-dpdp-act-implementation.pdf)); consent log; account deletion; access and correction requests; encrypted data | Most duties from 13 May 2027 ([Mondaq](https://www.mondaq.com/india/data-protection/1830402/dpdp-act-and-rules-2025-the-2026-compliance-milestones-businesses-cant-afford-to-miss)); build now |
| Handloom Mark Standards (Labelling and Display) Regulations | Anything sold as "handloom" must carry a valid Handloom Mark label; even traders must ensure labels and traceability to weaver or loom ([ELP](https://elplaw.in/wp-content/uploads/2026/03/ELP-Trade-Update-New-Marking-Requirements-for-Handlooms-Key-Features-and-Implications-for-Stakeholders.pdf)) | Register under the Handloom Mark Scheme; store label numbers and weaver/loom records per SKU; only show the "Handloom" badge where a label exists | Proposed: notified to the WTO in March 2026 with 1 Oct 2026 as the proposed entry into force; still described as draft in Sept 2026 ([TaxClue](https://www.taxclue.in/handloom-mark-registration-in-noida)). Verify current status |
| Silk Mark | Voluntary, but only authorised users may attach the label ([Sacred Weaves](https://www.sacredweaves.com/blogs/news/what-is-silk-mark-certification)) | Register with SMOI; label number field per product | Recommended |
| GI "Bhagalpur Silk" | Protected name; GI claims need the traditional process ([inkl / The Hindu](https://inkl.com/news/in-bihar-s-bhagalpur-weavers-face-a-silk-slub)) | Use "Bhagalpur Silk (GI)" only for qualifying products; otherwise say "woven in Bhagalpur" | Ongoing |
| GST | Silk sarees and fabrics under HSN 5007, cotton sarees under 5208/5209, all at 5% after the September 2025 changes; sarees count as fabric, not garments ([Accountune](https://accountune.com/hsn-code-sarees)) | HSN and rate per product; GST invoices; B2B GSTIN capture; GSTR-1 export from reports. Stitched garments (kurtas, blouses) follow apparel rates by price; confirm with the CA | In force |
| Payments and refunds | RBI card-tokenisation rules handled by the gateway | Never store card data; refunds to source by default | In force |
| Legal pages | Terms, Privacy, Shipping, Returns and Exchanges, Cancellation, Grievance Officer, Contact | Editable in the CMS, versioned, linked in the footer and checkout | Before launch |

Two product rules flow straight into the build: labels are claims, so a product can only show "Pure Silk", "Handloom" or "GI" badges when the matching record exists in the admin; and discount displays must come from real price history.

## Operations

Cash-on-delivery returns are the biggest threat to margin, so offer COD but steer high-value orders to prepaid. Razorpay puts the return-to-origin (RTO) rate at 25–30% for COD orders versus 2–3% for prepaid ([Razorpay](https://razorpay.com/blog/cash-on-delivery/)), and fashion is the highest-COD category ([Razorpay](https://razorpay.com/blog/cash-on-delivery-and-the-challenges/)). Fashion RTO averages 25–40%, with top performers at 12–18% ([Base](https://base.com/en-IN/blog/?p=22444)).

### Payments and COD policy

| Rule | Detail |
| --- | --- |
| Default to UPI | Show UPI first at checkout; cards, netbanking, wallets and EMI behind it |
| Prepaid incentive | A small visible saving or free shipping for paying online; brands report 20–30% of COD intenders converting ([ShipPrime](https://shipprime.live/resources/blogs/cod-vs-prepaid-rto-profitability)) |
| COD limits | COD only up to a set order value (for example ₹5,000) and on serviceable PIN codes; a nominal COD fee shown upfront |
| COD confirmation | Automated WhatsApp confirmation within minutes, offering a prepaid link; unconfirmed orders held, not shipped |
| Partial COD (optional) | Small token prepaid, balance on delivery, for high-value pieces |
| Settlement | Daily reconciliation in the admin of gateway settlements and courier COD remittances against orders |

### Shipping

- Use a courier aggregator (Shiprocket or similar) for multi-carrier rates and pan-India PIN-code coverage; enable surface for standard and air for express.
- Dispatch target: within 24–48 hours for ready stock; show "made to order" lead times honestly for weaver-commissioned pieces.
- Free shipping above a threshold, set from real average order value once data exists.
- NDR workflow: failed-delivery alerts reach the customer by WhatsApp for reattempt scheduling before an RTO is triggered.
- Insure shipments above a set value; use tamper-evident packaging.

### Packaging and unboxing

Silk needs protection from moisture, crushing and light. Fold each saree with acid-free tissue in a breathable cotton pouch, inside a rigid branded box, inside a waterproof outer mailer. Include the care card, the authenticity card (Silk Mark and Handloom Mark numbers, weaver credit) and a handwritten-style thank-you note. Photograph each piece during packing as evidence for any dispute.

### Returns and exchanges

| Policy point | Recommendation |
| --- | --- |
| Window | 7 days from delivery for unused items with tags and labels intact |
| Exchange first | Offer exchange or store credit with free reverse pickup; refund to source on request |
| Exclusions | Custom-cut fabric, stitched-to-measure items, sale "final" items (stated clearly before purchase) |
| Quality check | Inspect for wear, perfume, stains and label removal before refund |
| Unboxing video | Request one for damage or wrong-item claims |

### Day-to-day team (launch)

One operations lead (orders, couriers, COD), one catalogue and content executive (photos, listings), one customer-support person on WhatsApp, phone and email, plus a part-time accountant. Photography can be outsourced in batches.

## Roadmap, team, budget, KPIs and risks

The MVP takes about 16 weeks from kickoff to public launch, with brand and certifications starting on day one because they have the longest external lead times. Week numbers are relative; fix calendar dates once the kickoff date and target festival are agreed.

&#91;embedded content: MVP roadmap · six workstreams and three gates over 16 weeks\]

Build overlaps design from week 5 and content from week 8, so the critical path is design sign-off in week 6; certifications run in the background and must finish before "handloom" badges go live.

### Phase 2 (months 5–9 after launch)

Hindi storefront, B2B and wholesale portal, Amazon and Flipkart sync, loyalty and referrals, international shipping and multi-currency, virtual video-call shopping booked from the site, and a lookbook/catalogue generator for boutiques.

### Team

| Role | Responsibility | Load |
| --- | --- | --- |
| Tech lead / full-stack (Next.js, Supabase) | Architecture, storefront, admin extensions, integrations | Full time |
| Second full-stack developer | Checkout, payments, shipping, notifications, tests | Full time during build |
| UI/UX and brand designer | Logo, design system, storefront and admin screens, packaging | Weeks 1–8, then part time |
| SEO and content writer | Keyword map, collection and product copy, pillar guides | From week 6 |
| Photographer and stylist | Product, model and loom shoots | Batches from week 8 |
| Client operations owner | Catalogue data, certifications, couriers, policies | Ongoing |

### Indicative budget categories

Figures need vendor quotes; these lines set what to budget for, not final costs.

| Item | Type | Notes |
| --- | --- | --- |
| Brand identity and packaging design | One-time | Logo suite, guidelines, box, tags, cards |
| Trademark filings (3 classes) | One-time | Government fee per class plus attorney fee |
| Silk Mark, Handloom Mark registrations and labels | One-time + per label | Labels are bought per piece |
| Photography and video | One-time per collection | Plan a reshoot each festive season |
| Development (MVP) | One-time | Own time; open-source libraries only |
| Hosting, database, CDN, search, media | Monthly | ₹0 on Vercel Hobby and Supabase Free; paid tiers only once live sales start |
| Payment gateway | Per transaction | 2% + GST on standard Razorpay pricing |
| Shipping and COD | Per order | Aggregator rates by weight and zone |
| WhatsApp, SMS and email | Per message | Template-message pricing |
| Marketing (ads, influencers, PR) | Monthly | Heaviest in the 6 weeks before each festival |

### KPIs to track from day one

| KPI | Why it matters | First-year target (proposed) |
| --- | --- | --- |
| Conversion rate | Storefront effectiveness | Set after 60 days of baseline data |
| Average order value | Pricing and bundling health | Above ₹4,000 |
| Prepaid share of orders | Margin and RTO risk | Over 70% |
| COD RTO rate | Logistics cost | Under 18%, the top-performer band for fashion |
| Return/exchange rate | Product-description accuracy | Under 8% |
| Organic share of sessions | SEO payoff | Over 40% by month 12 |
| Page-one rankings for core clusters | Category ownership | 15+ core terms by month 9 |
| Repeat-purchase rate (12 months) | Brand loyalty | Over 25% |
| Mobile LCP (p75) | Speed | ≤ 2.5 s |

### Key risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Handloom Mark becomes mandatory before registration | Cannot call products "handloom" | Start Handloom Mark registration in week 1; badge only labelled stock |
| Stock data errors on one-of-a-kind pieces | Double-selling, cancellations | Checkout reservations, daily stock audit, quantity-1 SKUs |
| Raw-silk price swings and supply disruption (floods, yarn costs) | Margin squeeze, stock-outs | Price-review workflow in the admin; "made to order" status; buffer stock before festivals |
| High COD RTO | Lost margin | COD limits, confirmation, prepaid incentives, PIN-code rules |
| Photo colour mismatch | Returns, bad reviews | Colour-calibrated daylight shoots; "colour may vary slightly" note with daylight photo |
| Scope creep delays launch past the festival | Missed peak | Fixed MVP scope; phase-2 backlog; cut scope rather than slip the date |
| Counterfeits copying photos and the brand | Brand damage | Watermarked zoom images, trademark registration, takedown process |

### Open questions for the client

- [ ] Is the business the "Bahram Raw Silk" listed since 1948?
- [ ] Legal entity name, GSTIN, registered address and grievance-officer details
- [ ] Existing Silk Mark, Handloom Mark or India Handloom Brand registrations
- [ ] Product mix at launch: sarees only, or also fabric by the metre, stoles, dress material, menswear and home furnishing?
- [ ] Number of SKUs at launch, and how many are one-of-a-kind
- [ ] Own looms, partner weavers or both? Will weavers be named on the site?
- [ ] Price range and margin targets per category
- [ ] Target launch festival and hard deadline
- [ ] Who will run operations, support and the admin day to day?
- [ ] Domain names and social handles already owned
- [ ] Budget envelope and preference for in-house build vs agency
- [ ] Retail outlet in Bhagalpur for local pickup and Google Business Profile?

## Sources

**Craft, GI and certification:** [MAP Academy: Bhagalpuri Silk](https://mapacademy.io/?p=3112) · [Wikipedia: Bhagalpur sari](https://en.wikipedia.org/wiki/Bhagalpur_sari) · [Krafteria: GI registration details](https://krafteria.com/sv/blogs/news/bhagalpur-silk-bhagalpuri-tussar-silk-silk-craft-of-bihar) · [Incredible India: Bhagalpur silk](https://www.incredibleindia.gov.in/en/bihar/bhagalpur-silk) · [Gaatha: cluster and yarn types](https://shop.gaatha.com/buy-bhagalpuri-silk-dupatta-7) · [My Textile Notes: ghicha and matka](https://mytextilenotes.blogspot.com/2026/05/silk-fabric-terms-explained-part-5.html) · [Fibre2Fashion: Indian silk for apparel](https://www.fibre2fashion.com/industry-article/2424/indian-silk-for-fashion-apparels) · [The Hindu via PressReader: weavers face a slub](https://www.pressreader.com/india/the-hindu-international-9BN2/20240318/281638195187629) · [inkl: In Bihar's Bhagalpur, weavers face a silk slub](https://inkl.com/news/in-bihar-s-bhagalpur-weavers-face-a-silk-slub) · [ETV Bharat: Ganga floods hit weaving units](https://www.etvbharat.com/en/videos/bhagalpur-silk-city-comes-to-a-halt-as-ganga-floods-inundate-weaving-units-enn26091102689) · [TextileInfomedia: Bahram Raw Silk listing](https://www.textileinfomedia.com/bahram-raw-silk) · [Vikaspedia: Silk Mark Organisation of India](https://en.vikaspedia.in/viewcontent/indian-silk/silk-mark-organisation-of-india-smoi-/silk-mark-organisation-of-india?lgn=en) · [Sacred Weaves: Silk Mark certification](https://www.sacredweaves.com/blogs/news/what-is-silk-mark-certification) · [Amazon India: Silk Mark MoU](https://press.aboutamazon.com/in/2020/11/amazon-india-inks-mou-with-silk-mark-organisation-of-india) · [Fashion Value Chain: Handloom Mark](https://fashionvaluechain.com/?p=57607) · [Indian Textile Journal: Bihar silk hub](https://indiantextilejournal.com/?p=2544201)

**Market and competitors:** [IMARC saree market summary](https://sites.google.com/view/indiamarketresearchreports/india-saree-market) · [IndieHaat citing Redseer](https://indiehaat.com/blogs/artisan-news/indian-ethnic-wear-online-sees-boost-from-festive-season-demand) · [DFU Publications: online saree brands](https://dfupublications.com/index.php/news/apparel?start=65) · [DFU Publications: business of the modern sari](https://dfupublications.com/index.php/news/apparel/six-yards-infinite-possibilities-the-business-of-the-modern-indian-sari) · [Nalli: Bhagalpuri tussar](https://www.nalli.com/collections/bhagalpuri-tussar) · [Parisera: Bhagalpuri sarees](https://parisera.com/collections/bhagalpuri-sarees) · [India Handmade product](https://www.indiahandmade.com/catalog/product/view/id/23807) · [India Handmade low-price listing](https://www.indiahandmade.com/catalog/product/view/id/23870) · [Flipkart listing](https://www.flipkart.com/govind-handloom-solid-plain-bollywood-jute-silk-saree/p/itmb755f8cffe4fb) · [Dial4Trade: Bhagalpur zari sarees](https://www.dial4trade.com/bhagalpur/zari-border-saree.htm) · [YourStory: Bhashabharat](https://yourstory.com/2019/08/startup-bharat-bhagalpur-based-bhashabharat-ecommerce-saree) · [YourStory: Golghar](https://ts.yourstory.com/smbstory/d2c-banaras-saree-brand-golghar-org)

**Technology, SEO and operations:** [Vercel: fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) · [Vercel: Hobby plan](https://vercel.com/docs/plans/hobby) · [JetAdmin: Supabase plans and limits](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) · [DEV Community: Supabase free tier limits](https://dev.to/mahdi_benrhouma_fe1c6005/supabase-free-tier-limits-in-2026-what-you-actually-get-and-when-you-will-hit-them-4mhe) · [Razorpay: pricing explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/) · [Razorpay: cash on delivery](https://razorpay.com/blog/cash-on-delivery/) · [Razorpay: COD challenges](https://razorpay.com/blog/cash-on-delivery-and-the-challenges/) · [Base: RTO by category 2026](https://base.com/en-IN/blog/?p=22444) · [ShipPrime: COD vs prepaid](https://shipprime.live/resources/blogs/cod-vs-prepaid-rto-profitability) · [Pemavor: shipping and returns in Search](https://www.pemavor.com/?p=28384) · [Shopify Community: merchant listing fields](https://community.shopify.com/t/how-to-fix-search-consol-hasmerchantreturnpolicy-and-shippingdetails-missing-issue/252294)

**Law and tax:** [ELP: Handloom Mark regulations](https://elplaw.in/wp-content/uploads/2026/03/ELP-Trade-Update-New-Marking-Requirements-for-Handlooms-Key-Features-and-Implications-for-Stakeholders.pdf) · [TaxClue: Handloom Mark status](https://www.taxclue.in/handloom-mark-registration-in-noida) · [IndiaLaw: E-Commerce Rules](https://www.indialaw.in/blog/civil/consumer-protection-e-commerce-rules/pdf/) · [Mondaq: E-Commerce Rules 2020](https://www.mondaq.com/india/dodd-frank-consumer-protection-act/995148/the-consumer-protection-e-commerce-rules-2020) · [Mondaq: 2026 amendment](https://www.mondaq.com/india/consumer-law/1845298/rethinking-e-commerce-compliance-key-changes-under-the-consumer-protection-e-commerce-amendment-rules-2026) · [Business Standard: rules from 2027](https://www.business-standard.com/industry/news/online-shopping-to-get-stricter-consumer-rules-on-pricing-rankings-in-2027-126091400371_1.html) · [ETV Bharat/PTI: amended rules](https://www.etvbharat.com/en/business/govt-amends-e-commerce-rules-to-check-price-manipulation-dark-patterns-fake-sponsored-listings-enn26091005812) · [Retail Insight Network](https://www.retail-insight-network.com/newsletters/india-tightens-e-commerce-rules) · [PIB: consumer protection document](https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/mar/doc2025314520301.pdf) · [JSA: DPDP Rules](https://www.jsalaw.com/wp-content/uploads/2025/11/JSA-Prism-InfoTech-November-2025-DPDP-Rules.Final_.pdf) · [KPMG: DPDP Rules guidance](https://assets.kpmg.com/content/dam/kpmgsites/in/pdf/2025/11/dpdp-rules-2025-guidance-to-dpdp-act-implementation.pdf) · [Mondaq: DPDP milestones](https://www.mondaq.com/india/data-protection/1830402/dpdp-act-and-rules-2025-the-2026-compliance-milestones-businesses-cant-afford-to-miss) · [Accountune: saree HSN and GST](https://accountune.com/hsn-code-sarees)
