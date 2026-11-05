-- Demo seed (hosted demo project and CI). EVERYTHING HERE IS SAMPLE DATA.
-- Weavers are fictional and flagged is_sample; label numbers contain "SAMPLE"; users use the
-- .local domain. Never load this file into staging or production.
--
-- Demo sign-in:
--   owner@bahramsilks.local       staff: owner      password: bahram-local-dev
--   fulfilment@bahramsilks.local  staff: fulfilment password: bahram-local-dev
--   asha@shopper.local            shopper with a delivered order
--   vikram@shopper.local          shopper with a confirmed order

-------------------------------------------------------------------------------
-- Users
-------------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('bahram-local-dev', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.full_name),
  now(), now(), '', '', '', '', '', '', '', ''
from (values
  ('00000000-0000-4000-a000-000000000001'::uuid, 'owner@bahramsilks.local', 'Local Owner'),
  ('00000000-0000-4000-a000-000000000002'::uuid, 'fulfilment@bahramsilks.local', 'Local Fulfilment'),
  ('00000000-0000-4000-a000-000000000101'::uuid, 'asha@shopper.local', 'Asha Verma (sample)'),
  ('00000000-0000-4000-a000-000000000102'::uuid, 'vikram@shopper.local', 'Vikram Rao (sample)')
) as u (id, email, full_name);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%.local';

insert into public.staff_members (user_id, role, display_name, email) values
  ('00000000-0000-4000-a000-000000000001', 'owner', 'Local Owner', 'owner@bahramsilks.local'),
  ('00000000-0000-4000-a000-000000000002', 'fulfilment', 'Local Fulfilment', 'fulfilment@bahramsilks.local');

update public.customers set phone = '+919800000101', tags = '{VIP}'
 where email = 'asha@shopper.local';
update public.customers set phone = '+919800000102', tags = '{boutique}'
 where email = 'vikram@shopper.local';

insert into public.addresses (customer_id, label, full_name, phone, line1, line2, city, state, state_code, pincode, is_default_shipping, is_default_billing)
select c.id, 'Home', 'Asha Verma', '+919800000101', '14 Sample Lane', 'Indiranagar', 'Bengaluru', 'Karnataka', '29', '560038', true, true
from public.customers c where c.email = 'asha@shopper.local';
insert into public.addresses (customer_id, label, full_name, phone, line1, city, state, state_code, pincode, is_default_shipping, is_default_billing)
select c.id, 'Studio', 'Vikram Rao', '+919800000102', '2 Sample Studio Road, Bandra West', 'Mumbai', 'Maharashtra', '27', '400050', true, true
from public.customers c where c.email = 'vikram@shopper.local';

-------------------------------------------------------------------------------
-- Settings, shipping zones, serviceable PIN codes
-------------------------------------------------------------------------------
insert into public.settings (key, value, is_public, description) values
  ('cod_max_order_paise', '500000', true, 'COD is offered only up to this order total (₹5,000).'),
  ('cod_fee_paise', '4900', true, 'Flat COD fee shown upfront on product, cart and checkout. TODO(client): confirm amount.'),
  ('free_shipping_threshold_paise', '250000', true, 'Free standard shipping at or above this order total. TODO(client): set from real AOV.'),
  ('prepaid_incentive', '{"type": "flat", "amount_paise": 10000, "message": "Save ₹100 when you pay online"}', true, 'Shown on cart and checkout; applied by the automatic offer of the same name.'),
  ('gift_wrap_paise', '9900', true, 'Optional gift wrap. Never pre-selected.'),
  ('return_window_days', '7', true, 'Days from delivery to request a return or exchange.'),
  ('reservation_minutes', '15', false, 'Stock hold at checkout. Enforced in reserve_stock(); informational here.'),
  ('low_stock_threshold_default', '{"piece": 1, "metre": 10}', false, 'Low-stock alert when available falls to or below this.'),
  ('legal_entity', '{"name": "Bahram Raw Silk", "trade_name": "Bahram Silks", "address": "Hossainabad, Bounsi Road, Near Jama Masjid, Bhagalpur 812005, Bihar, India", "gstin": "10AAFFB7503A1ZF", "email": "care@bahramsilk.com", "phone": "+91-9801616789"}', true, 'Seller identity shown in the footer, invoices and legal pages.'),
  ('grievance_officer', '{"name": null, "designation": "Grievance Officer", "email": "grievance@bahramsilk.com", "phone": null, "hours": "Monday to Saturday, 10:00 to 18:00 IST"}', true, 'Consumer Protection (E-Commerce) Rules: published grievance officer.'),
  ('gst', '{"seller_state": "Bihar", "seller_state_code": "10", "gstin": "10AAFFB7503A1ZF", "default_hsn_silk": "5007", "default_rate_bps": 500}', true, 'Place of supply and invoice defaults.'),
  ('privacy_notice_version', '"2026-10-draft"', true, 'Version recorded with every consent event.'),
  ('notifications', '{"order_email": true, "order_whatsapp": true, "from_email": "orders@bahramsilk.com"}', false, 'Which order-status channels are active.');

insert into public.shipping_zones (code, name, standard_rate_paise, express_rate_paise) values
  ('bihar', 'Bihar', 4900, 9900),
  ('metro', 'Metro cities', 7900, 14900),
  ('rest_of_india', 'Rest of India', 9900, 17900),
  ('special', 'North East, J&K and islands', 14900, null);

insert into public.serviceable_pincodes (pincode, city, district, state, state_code, zone, cod_available, est_days_min, est_days_max) values
  ('812001', 'Bhagalpur', 'Bhagalpur', 'Bihar', '10', 'bihar', true, 1, 2),
  ('812002', 'Bhagalpur', 'Bhagalpur', 'Bihar', '10', 'bihar', true, 1, 2),
  ('812005', 'Bhagalpur', 'Bhagalpur', 'Bihar', '10', 'bihar', true, 1, 2),
  ('813210', 'Sultanganj', 'Bhagalpur', 'Bihar', '10', 'bihar', true, 2, 3),
  ('800001', 'Patna', 'Patna', 'Bihar', '10', 'bihar', true, 2, 3),
  ('800013', 'Patna', 'Patna', 'Bihar', '10', 'bihar', true, 2, 3),
  ('800020', 'Patna', 'Patna', 'Bihar', '10', 'bihar', true, 2, 3),
  ('842001', 'Muzaffarpur', 'Muzaffarpur', 'Bihar', '10', 'bihar', true, 2, 4),
  ('823001', 'Gaya', 'Gaya', 'Bihar', '10', 'bihar', true, 2, 4),
  ('110001', 'New Delhi', 'New Delhi', 'Delhi', '07', 'metro', true, 3, 5),
  ('110017', 'New Delhi', 'South Delhi', 'Delhi', '07', 'metro', true, 3, 5),
  ('110025', 'New Delhi', 'South East Delhi', 'Delhi', '07', 'metro', true, 3, 5),
  ('110092', 'Delhi', 'East Delhi', 'Delhi', '07', 'metro', true, 3, 5),
  ('201301', 'Noida', 'Gautam Buddh Nagar', 'Uttar Pradesh', '09', 'metro', true, 3, 5),
  ('122001', 'Gurugram', 'Gurugram', 'Haryana', '06', 'metro', true, 3, 5),
  ('400001', 'Mumbai', 'Mumbai', 'Maharashtra', '27', 'metro', true, 4, 6),
  ('400050', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '27', 'metro', true, 4, 6),
  ('400076', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '27', 'metro', true, 4, 6),
  ('411001', 'Pune', 'Pune', 'Maharashtra', '27', 'rest_of_india', true, 4, 6),
  ('560001', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '29', 'metro', true, 4, 6),
  ('560034', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '29', 'metro', true, 4, 6),
  ('560038', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '29', 'metro', true, 4, 6),
  ('560066', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '29', 'metro', true, 4, 6),
  ('700001', 'Kolkata', 'Kolkata', 'West Bengal', '19', 'metro', true, 2, 4),
  ('700019', 'Kolkata', 'Kolkata', 'West Bengal', '19', 'metro', true, 2, 4),
  ('700091', 'Kolkata', 'North 24 Parganas', 'West Bengal', '19', 'metro', true, 2, 4),
  ('600040', 'Chennai', 'Chennai', 'Tamil Nadu', '33', 'metro', true, 5, 7),
  ('500081', 'Hyderabad', 'Hyderabad', 'Telangana', '36', 'metro', true, 4, 6),
  ('380009', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '24', 'rest_of_india', true, 4, 7),
  ('302001', 'Jaipur', 'Jaipur', 'Rajasthan', '08', 'rest_of_india', true, 4, 6),
  ('226001', 'Lucknow', 'Lucknow', 'Uttar Pradesh', '09', 'rest_of_india', true, 3, 5),
  ('781001', 'Guwahati', 'Kamrup Metropolitan', 'Assam', '18', 'special', false, 5, 8),
  ('190001', 'Srinagar', 'Srinagar', 'Jammu and Kashmir', '01', 'special', false, 6, 9);

insert into public.automatic_offers (name, customer_message, type, amount_paise, prepaid_only, priority)
values ('Prepaid incentive', 'Save ₹100 when you pay online', 'flat', 10000, true, 10);

-------------------------------------------------------------------------------
-- Stock locations, weavers, looms
-------------------------------------------------------------------------------
insert into public.stock_locations (code, name, type, address, is_default, sellable) values
  ('bhagalpur-shop', 'Bhagalpur shop', 'shop', 'Bhagalpur, Bihar', true, true),
  ('bhagalpur-warehouse', 'Bhagalpur warehouse', 'warehouse', 'Bhagalpur, Bihar', false, true),
  ('with-weavers', 'On the looms (with weavers)', 'with_weaver', 'Nathnagar and Champanagar, Bhagalpur', false, false);

insert into public.weavers (slug, name, locality, bio, years_weaving, specialities, is_sample, status) values
  ('sample-weaver-nathnagar', 'Sameer Ansari (sample)', 'Nathnagar',
   'Sample profile for local development. A tussar specialist working a two-pedal pit loom; replace with a real weaver''s story, shared with their consent, before launch.',
   22, '{tussar,ghicha}', true, 'published'),
  ('sample-weaver-champanagar', 'Sunita Devi (sample)', 'Champanagar',
   'Sample profile for local development. Weaves matka and raw-silk yardage on a frame loom; replace with a real weaver''s story before launch.',
   15, '{matka,raw_silk}', true, 'published'),
  ('sample-weaver-mirzafari', 'Arjun Tanti (sample)', 'Mirzafari',
   'Sample profile for local development. Known in the cluster for zari borders on tussar; replace with a real weaver''s story before launch.',
   30, '{tussar,mulberry}', true, 'published'),
  ('sample-weaver-puraini', 'Meena Kumari (sample)', 'Puraini',
   'Sample profile for local development. Weaves cotton-silk and linen-stripe fabric; replace with a real weaver''s story before launch.',
   12, '{cotton_silk,linen}', true, 'published');

insert into public.looms (weaver_id, code, loom_type, locality)
select w.id, l.code, l.loom_type, w.locality
from (values
  ('sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', 'Pit loom'),
  ('sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', 'Frame loom'),
  ('sample-weaver-mirzafari', 'SAMPLE-LOOM-MRZ-01', 'Pit loom with jacquard'),
  ('sample-weaver-puraini', 'SAMPLE-LOOM-PUR-01', 'Frame loom')
) as l (weaver_slug, code, loom_type)
join public.weavers w on w.slug = l.weaver_slug;

-------------------------------------------------------------------------------
-- Products
-------------------------------------------------------------------------------
create temporary table seed_products (
  slug text, title text, subtitle text, kind public.product_kind, primary_fibre public.fibre,
  fibre_warp public.fibre, fibre_weft public.fibre, composition text, weave text, zari text,
  blouse_included boolean, length_m numeric, blouse_length_m numeric, width_cm numeric,
  weight_g integer, hsn_code text, occasions public.occasion[], is_one_of_a_kind boolean,
  made_to_order boolean, lead_time_days integer, gi_eligible boolean, weaver_slug text,
  loom_code text, returnable boolean, swatch_available boolean, featured_rank integer,
  status public.publish_status, published_days_ago integer, description text
);

insert into seed_products values
  ('tussar-silk-saree-natural-gold-zari-border', 'Natural Gold Tussar Silk Saree with Zari Border', 'One of a kind',
   'saree', 'tussar', 'tussar', 'tussar', 'Tussar silk warp, tussar silk weft; tested zari border', 'Plain weave', 'Tested zari border',
   true, 5.5, 0.8, null, 520, '5007', '{festive,puja}', true, false, null, true,
   'sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', true, false, 1, 'published', 10,
   '<p>Undyed tussar in its own gold, woven on a pit loom in Nathnagar. The slight slub of hand-reeled yarn gives the drape its matte, living texture; a narrow tested-zari border frames the length and the pallu.</p>'),
  ('tussar-ghicha-saree-rust-stripe', 'Rust Tussar-Ghicha Saree with Woven Stripes', 'One of a kind',
   'saree', 'tussar', 'tussar', 'ghicha', 'Tussar silk warp, ghicha silk weft', 'Stripe', null,
   true, 5.5, 0.8, null, 560, '5007', '{office,festive}', true, false, null, true,
   'sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', true, false, 2, 'published', 20,
   '<p>A smooth tussar warp crossed with hand-drawn ghicha weft, so the stripes carry the rustic, irregular texture ghicha is known for. Light enough for long office days.</p>'),
  ('ghicha-silk-saree-indigo-checks', 'Indigo Ghicha Silk Saree in Small Checks', null,
   'saree', 'ghicha', 'ghicha', 'ghicha', 'Ghicha silk warp and weft', 'Check', null,
   false, 6.3, null, null, 600, '5007', '{office}', false, false, null, false,
   'sample-weaver-nathnagar', null, true, false, null, 'published', 35,
   '<p>Textured ghicha woven into small indigo checks. Sold without a blouse piece. No Silk Mark label is recorded for this design yet, so it carries no Silk Mark badge.</p>'),
  ('matka-silk-saree-temple-border', 'Matka Silk Saree with Temple Border', null,
   'saree', 'matka', 'matka', 'matka', 'Matka silk warp and weft (hand-spun mulberry)', 'Plain weave with temple border', null,
   true, 5.5, 0.9, null, 640, '5007', '{festive,puja,gifting}', false, false, null, false,
   'sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', true, false, 3, 'published', 15,
   '<p>Matka is hand-spun from pierced mulberry cocoons, which gives it a thick, slubby body. Woven in Bhagalpur with a woven temple border in a self colour.</p>'),
  ('raw-silk-saree-mustard', 'Mustard Raw Silk Saree', null,
   'saree', 'raw_silk', 'raw_silk', 'raw_silk', 'Raw silk warp and weft (sericin retained)', 'Plain weave', null,
   true, 5.5, 0.8, null, 580, '5007', '{office,gifting}', false, false, null, false,
   'sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', true, false, 4, 'published', 90,
   '<p>Raw silk keeps its natural gum, so this saree has a crisp, structured fall that holds pleats well. A plain mustard ground with a contrast blouse piece.</p>'),
  ('tussar-silk-bridal-saree-maroon-zari', 'Maroon Tussar Silk Bridal Saree with Zari Pallu', 'One of a kind',
   'saree', 'tussar', 'tussar', 'tussar', 'Tussar silk warp and weft; tested zari pallu and border', 'Jacquard', 'Tested zari pallu and border',
   true, 5.5, 1.0, null, 780, '5007', '{wedding,festive}', true, false, null, true,
   'sample-weaver-mirzafari', 'SAMPLE-LOOM-MRZ-01', true, false, 5, 'published', 25,
   '<p>Dyed in deep maroon and woven on a jacquard pit loom, with a heavy tested-zari pallu that took several weeks at the loom. A single piece.</p>'),
  ('cotton-silk-saree-sea-green', 'Sea Green Cotton-Silk Saree', null,
   'saree', 'cotton_silk', 'cotton', 'mulberry', 'Cotton-silk blend: cotton warp, silk weft', 'Plain weave', null,
   true, 5.5, 0.8, null, 450, '5007', '{office}', false, false, null, false,
   'sample-weaver-puraini', 'SAMPLE-LOOM-PUR-01', true, false, null, 'published', 40,
   '<p>An everyday cotton-silk blend, labelled as a blend: soft cotton warp with a silk weft for a gentle sheen. Breathable for warm days.</p>'),
  ('linen-saree-ivory-silver-border', 'Ivory Linen Saree with Silver Border', null,
   'saree', 'linen', 'linen', 'linen', 'Linen warp and weft; silver-tone border', 'Plain weave', null,
   true, 5.5, 0.8, null, 480, '5309', '{office,gifting}', false, false, null, false,
   'sample-weaver-puraini', 'SAMPLE-LOOM-PUR-01', true, false, null, 'published', 50,
   '<p>Crisp linen woven in Bhagalpur, finished with a fine silver-tone border. Linen softens with every wash.</p>'),
  ('tussar-silk-saree-made-to-order', 'Tussar Silk Saree, Woven to Order in Your Colour', 'Made to order',
   'saree', 'tussar', 'tussar', 'tussar', 'Tussar silk warp and weft', 'Plain weave', 'Tested zari border',
   true, 5.5, 0.8, null, 520, '5007', '{wedding,gifting}', false, true, 21, true,
   'sample-weaver-mirzafari', 'SAMPLE-LOOM-MRZ-01', false, false, null, 'published', 5,
   '<p>Choose a ground colour and we will commission it from our weavers. Weaving and finishing take about three weeks before dispatch. Made-to-order pieces cannot be returned except for defects.</p>'),
  ('tussar-saree-unreleased-draft', 'Unreleased Tussar Saree (draft)', null,
   'saree', 'tussar', 'tussar', 'tussar', 'Tussar silk warp and weft', 'Plain weave', null,
   true, 5.5, 0.8, null, 520, '5007', '{festive}', true, false, null, true,
   'sample-weaver-nathnagar', null, true, false, null, 'draft', null,
   '<p>Draft product used to check that unpublished items stay hidden from shoppers.</p>'),
  ('raw-silk-fabric-natural', 'Natural Raw Silk Fabric', 'Per metre',
   'fabric', 'raw_silk', 'raw_silk', 'raw_silk', 'Raw silk warp and weft', 'Plain weave', null,
   false, null, null, 112, 110, '5007', '{office,festive}', false, false, null, false,
   'sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', false, true, null, 'published', 60,
   '<p>Undyed raw silk yardage, 44 inches wide, for kurtas, jackets and suits. Sold per metre in 0.5 m steps; bulk prices apply from 10 m. Cut lengths are not returnable.</p>'),
  ('tussar-silk-fabric-natural-gold', 'Natural Gold Tussar Silk Fabric', 'Per metre',
   'fabric', 'tussar', 'tussar', 'tussar', 'Tussar silk warp and weft', 'Plain weave', null,
   false, null, null, 112, 95, '5007', '{festive,wedding}', false, false, null, true,
   'sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', false, true, null, 'published', 30,
   '<p>Tussar in its natural gold, woven 44 inches wide. A favourite of designers for jackets and lehengas. Bulk prices from 10 m.</p>'),
  ('matka-silk-fabric-beige', 'Beige Matka Silk Fabric', 'Per metre',
   'fabric', 'matka', 'matka', 'matka', 'Matka silk warp and weft', 'Plain weave', null,
   false, null, null, 112, 120, '5007', '{office,festive}', false, false, null, false,
   'sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', false, true, null, 'published', 75,
   '<p>Slubby, substantial matka in a warm beige, suited to jackets, suits and furnishing. Sold per metre.</p>'),
  ('linen-stripe-fabric-natural', 'Linen Stripe Fabric with Tussar Stripes', 'Per metre',
   'fabric', 'linen', 'linen', 'linen', 'Linen with woven tussar silk stripes', 'Stripe', null,
   false, null, null, 110, 100, '5309', '{office}', false, false, null, false,
   'sample-weaver-puraini', 'SAMPLE-LOOM-PUR-01', false, true, null, 'published', 45,
   '<p>Natural linen ground with narrow tussar stripes. Shirting and kurta weight. Sold per metre; bulk prices from 10 m.</p>'),
  ('cotton-silk-fabric-ivory', 'Ivory Cotton-Silk Fabric', 'Per metre',
   'fabric', 'cotton_silk', 'cotton', 'mulberry', 'Cotton-silk blend: cotton warp, silk weft', 'Plain weave', null,
   false, null, null, 110, 80, '5007', '{office}', false, false, null, false,
   'sample-weaver-puraini', 'SAMPLE-LOOM-PUR-01', false, true, null, 'published', 100,
   '<p>A light cotton-silk blend with a soft sheen, ready to dye or wear as is. Sold per metre.</p>'),
  ('tussar-silk-stole-natural', 'Natural Tussar Silk Stole', null,
   'stole_dupatta', 'tussar', 'tussar', 'tussar', 'Tussar silk warp and weft', 'Plain weave with tasselled ends', null,
   false, 2.0, null, 70, 120, '5007', '{gifting,office}', false, false, null, true,
   'sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', true, false, null, 'published', 12,
   '<p>A light tussar stole, 2 m by 70 cm, finished with hand-knotted tassels. Comes boxed, ready to gift.</p>'),
  ('matka-silk-kurta-fabric-2-5m', 'Matka Silk Kurta Fabric (2.5 m)', null,
   'kurta_fabric', 'matka', 'matka', 'matka', 'Matka silk warp and weft', 'Plain weave', null,
   false, 2.5, null, 112, 300, '5007', '{festive,wedding}', false, false, null, false,
   'sample-weaver-champanagar', 'SAMPLE-LOOM-CHP-01', true, false, null, 'published', 18,
   '<p>A pre-cut 2.5 m length of matka silk, enough for a men''s kurta up to size 44.</p>'),
  ('tussar-dress-material-three-piece', 'Tussar Silk Dress Material, Three Piece', null,
   'dress_material', 'tussar', 'tussar', 'tussar', 'Kurta and dupatta: tussar silk; bottom: cotton-silk blend', 'Plain weave', null,
   false, 7.5, null, 112, 650, '5007', '{festive,gifting}', false, false, null, false,
   'sample-weaver-nathnagar', 'SAMPLE-LOOM-NTH-01', true, false, null, 'published', 22,
   '<p>Unstitched set: 2.5 m tussar for the kurta, a 2.5 m tussar dupatta and 2.5 m cotton-silk for the bottom.</p>'),
  ('ghicha-cushion-covers-pair', 'Ghicha Silk Cushion Covers, Set of Two', null,
   -- TODO(client): confirm HSN and GST rate for made-up furnishings with the CA.
   'home_furnishing', 'ghicha', 'ghicha', 'ghicha', 'Ghicha silk front, cotton back', 'Plain weave', null,
   false, null, null, 40, 300, '6304', '{gifting}', false, false, null, false,
   'sample-weaver-nathnagar', null, true, false, null, 'published', 28,
   '<p>Two 16 x 16 inch covers in textured ghicha with a cotton back and concealed zip. Inserts not included.</p>');

insert into public.products (
  slug, title, subtitle, kind, primary_fibre, fibre_warp, fibre_weft, composition, weave, zari,
  blouse_included, length_m, blouse_length_m, width_cm, weight_g, care, description, hsn_code,
  gst_rate_bps, occasions, is_one_of_a_kind, made_to_order, lead_time_days, gi_eligible,
  weaver_id, loom_id, returnable, swatch_available, swatch_price_paise, featured_rank, status,
  published_at, seo_title, seo_description, created_by
)
select
  sp.slug, sp.title, sp.subtitle, sp.kind, sp.primary_fibre, sp.fibre_warp, sp.fibre_weft,
  sp.composition, sp.weave, sp.zari, sp.blouse_included, sp.length_m, sp.blouse_length_m,
  sp.width_cm, sp.weight_g,
  case when sp.primary_fibre in ('linen', 'cotton_silk')
    then 'Gentle hand wash in cold water with mild detergent, or dry clean. Dry in shade. Iron on medium heat.'
    else 'Dry clean only for the first wash. Store folded in a cotton or muslin cloth away from damp and direct sunlight, and refold every few months. Iron on low heat on the reverse.'
  end,
  sp.description, sp.hsn_code, 500, sp.occasions, sp.is_one_of_a_kind, sp.made_to_order,
  sp.lead_time_days, sp.gi_eligible, w.id, l.id, sp.returnable, sp.swatch_available,
  case when sp.swatch_available then 15000 end, sp.featured_rank, sp.status,
  case when sp.published_days_ago is not null then now() - make_interval(days => sp.published_days_ago) end,
  sp.title || ' | Bahram Silks',
  left(regexp_replace(sp.description, '<[^>]+>', '', 'g'), 155),
  '00000000-0000-4000-a000-000000000001'
from seed_products sp
left join public.weavers w on w.slug = sp.weaver_slug
left join public.looms l on l.code = sp.loom_code;

-------------------------------------------------------------------------------
-- Variants, bulk tiers, genuine price drop
-------------------------------------------------------------------------------
insert into public.product_variants (product_id, sku, title, colour, colour_hex, sell_unit, price_paise, min_qty, step_qty, position)
select p.id, v.sku, v.title, v.colour, v.hex, v.unit::public.sell_unit, v.price, v.min_qty, v.step_qty, v.pos
from (values
  ('tussar-silk-saree-natural-gold-zari-border', 'BS-TSR-0001', 'Natural gold', 'Natural gold', '#C9A15B', 'piece', 680000, 1.0, 1.0, 0),
  ('tussar-ghicha-saree-rust-stripe', 'BS-TGH-0002', 'Rust', 'Rust', '#9A4A2A', 'piece', 540000, 1.0, 1.0, 0),
  ('ghicha-silk-saree-indigo-checks', 'BS-GHI-0003', 'Indigo', 'Indigo', '#2E3A63', 'piece', 420000, 1.0, 1.0, 0),
  ('matka-silk-saree-temple-border', 'BS-MAT-0004-OW', 'Off-white', 'Off-white', '#EFE7D6', 'piece', 590000, 1.0, 1.0, 0),
  ('matka-silk-saree-temple-border', 'BS-MAT-0004-BE', 'Beige', 'Beige', '#D8C3A0', 'piece', 590000, 1.0, 1.0, 1),
  ('raw-silk-saree-mustard', 'BS-RAW-0005', 'Mustard', 'Mustard', '#C9962B', 'piece', 450000, 1.0, 1.0, 0),
  ('tussar-silk-bridal-saree-maroon-zari', 'BS-BRD-0006', 'Maroon', 'Maroon', '#6B1E25', 'piece', 1450000, 1.0, 1.0, 0),
  ('cotton-silk-saree-sea-green', 'BS-CSL-0007-SG', 'Sea green', 'Sea green', '#5E9C8A', 'piece', 260000, 1.0, 1.0, 0),
  ('cotton-silk-saree-sea-green', 'BS-CSL-0007-OP', 'Onion pink', 'Onion pink', '#C98C8F', 'piece', 260000, 1.0, 1.0, 1),
  ('linen-saree-ivory-silver-border', 'BS-LIN-0008', 'Ivory', 'Ivory', '#F3EDE1', 'piece', 320000, 1.0, 1.0, 0),
  ('tussar-silk-saree-made-to-order', 'BS-MTO-0009', 'Your colour', null, null, 'piece', 750000, 1.0, 1.0, 0),
  ('tussar-saree-unreleased-draft', 'BS-DRF-0010', 'Natural', 'Natural gold', '#C9A15B', 'piece', 610000, 1.0, 1.0, 0),
  ('raw-silk-fabric-natural', 'BS-FRS-0011', 'Natural, per metre', 'Natural', '#E4D3B0', 'metre', 95000, 1.0, 0.5, 0),
  ('tussar-silk-fabric-natural-gold', 'BS-FTS-0012', 'Natural gold, per metre', 'Natural gold', '#C9A15B', 'metre', 145000, 1.0, 0.5, 0),
  ('matka-silk-fabric-beige', 'BS-FMT-0013', 'Beige, per metre', 'Beige', '#D8C3A0', 'metre', 115000, 1.0, 0.5, 0),
  ('linen-stripe-fabric-natural', 'BS-FLS-0014', 'Natural stripe, per metre', 'Natural', '#DCD2BF', 'metre', 69000, 1.0, 0.5, 0),
  ('cotton-silk-fabric-ivory', 'BS-FCS-0015', 'Ivory, per metre', 'Ivory', '#F3EDE1', 'metre', 54000, 1.0, 0.5, 0),
  ('tussar-silk-stole-natural', 'BS-STL-0016', 'Natural', 'Natural gold', '#C9A15B', 'piece', 185000, 1.0, 1.0, 0),
  ('matka-silk-kurta-fabric-2-5m', 'BS-KRT-0017', 'Natural, 2.5 m', 'Natural', '#E4D3B0', 'piece', 230000, 1.0, 1.0, 0),
  ('tussar-dress-material-three-piece', 'BS-DRM-0018', 'Natural gold with ivory', 'Natural gold', '#C9A15B', 'piece', 480000, 1.0, 1.0, 0),
  ('ghicha-cushion-covers-pair', 'BS-HOM-0019', 'Charcoal, set of two', 'Charcoal', '#3C3A38', 'piece', 160000, 1.0, 1.0, 0)
) as v (slug, sku, title, colour, hex, unit, price, min_qty, step_qty, pos)
join public.products p on p.slug = v.slug;

insert into public.variant_price_tiers (variant_id, min_qty, price_paise)
select v.id, t.min_qty, t.price
from (values
  ('BS-FRS-0011', 10.0, 88000), ('BS-FRS-0011', 25.0, 82000),
  ('BS-FTS-0012', 10.0, 135000), ('BS-FTS-0012', 25.0, 128000),
  ('BS-FMT-0013', 10.0, 107000), ('BS-FMT-0013', 25.0, 99000),
  ('BS-FLS-0014', 10.0, 64000), ('BS-FLS-0014', 25.0, 59000),
  ('BS-FCS-0015', 10.0, 50000), ('BS-FCS-0015', 25.0, 46000)
) as t (sku, min_qty, price)
join public.product_variants v on v.sku = t.sku;

-- Genuine price drop: the mustard raw-silk saree sold at ₹4,500 for 45 days, now ₹3,800.
update public.price_history ph
   set effective_from = now() - interval '45 days'
  from public.product_variants v
 where v.id = ph.variant_id and v.sku = 'BS-RAW-0005';
update public.product_variants
   set price_paise = 380000, compare_at_paise = 450000
 where sku = 'BS-RAW-0005';
-- Back-date every other variant's opening price period to its product's publish date.
update public.price_history ph
   set effective_from = coalesce(p.published_at, p.created_at)
  from public.product_variants v
  join public.products p on p.id = v.product_id
 where v.id = ph.variant_id and v.sku <> 'BS-RAW-0005';

-------------------------------------------------------------------------------
-- Media (paths may not exist yet; the UI falls back to a placeholder)
-------------------------------------------------------------------------------
insert into public.product_media (product_id, kind, storage_path, alt, sort, width, height)
select p.id, 'image', 'products/' || p.slug || '/' || lpad(n::text, 2, '0') || '.webp',
  case n
    when 1 then p.title || ', full drape'
    when 2 then p.title || ', close-up of the weave'
    else p.title || ', border and pallu detail'
  end,
  n - 1, 1600, 2000
from public.products p
cross join generate_series(1, 3) as n;

insert into public.product_media (product_id, kind, storage_path, poster_path, alt, sort, width, height)
select p.id, 'video', 'products/' || p.slug || '/loom.mp4', 'products/' || p.slug || '/loom-poster.webp',
  p.title || ' on the loom', 3, 1080, 1350
from public.products p
where p.slug = 'tussar-silk-bridal-saree-maroon-zari';

-------------------------------------------------------------------------------
-- Authenticity labels (some products deliberately have none)
-------------------------------------------------------------------------------
insert into public.authenticity_labels (label_type, label_number, product_id, variant_id, status, issued_on)
select l.label_type, l.label_number, p.id, v.id, 'attached', current_date - 30
from (values
  ('silk_mark', 'SM-SAMPLE-000101', 'tussar-silk-saree-natural-gold-zari-border', 'BS-TSR-0001'),
  ('handloom_mark', 'HLM-SAMPLE-000101', 'tussar-silk-saree-natural-gold-zari-border', 'BS-TSR-0001'),
  ('silk_mark', 'SM-SAMPLE-000102', 'tussar-ghicha-saree-rust-stripe', 'BS-TGH-0002'),
  ('silk_mark', 'SM-SAMPLE-000103', 'matka-silk-saree-temple-border', null),
  ('silk_mark', 'SM-SAMPLE-000104', 'raw-silk-saree-mustard', null),
  ('silk_mark', 'SM-SAMPLE-000105', 'tussar-silk-bridal-saree-maroon-zari', 'BS-BRD-0006'),
  ('handloom_mark', 'HLM-SAMPLE-000105', 'tussar-silk-bridal-saree-maroon-zari', 'BS-BRD-0006'),
  ('silk_mark', 'SM-SAMPLE-000112', 'tussar-silk-fabric-natural-gold', null),
  ('silk_mark', 'SM-SAMPLE-000116', 'tussar-silk-stole-natural', null)
) as l (label_type, label_number, slug, sku)
join public.products p on p.slug = l.slug
left join public.product_variants v on v.sku = l.sku;

insert into public.authenticity_labels (label_type, label_number, status, issued_on, notes) values
  ('silk_mark', 'SM-SAMPLE-000200', 'in_stock', current_date - 30, 'Unused label from the sample batch');

insert into public.label_usage_log (label_id, action, product_id, note, actor_id)
select l.id, 'attached', l.product_id, 'Attached at cataloguing (sample)', '00000000-0000-4000-a000-000000000001'
from public.authenticity_labels l where l.status = 'attached';

-------------------------------------------------------------------------------
-- Stock (through the ledger function so stock_adjustments is consistent)
-------------------------------------------------------------------------------
do $$
declare
  r record;
  v_shop uuid := (select id from public.stock_locations where code = 'bhagalpur-shop');
  v_warehouse uuid := (select id from public.stock_locations where code = 'bhagalpur-warehouse');
  v_looms uuid := (select id from public.stock_locations where code = 'with-weavers');
begin
  for r in
    select v.id, s.loc, s.qty
    from (values
      ('BS-TSR-0001', 'shop', 1), ('BS-TGH-0002', 'shop', 1), ('BS-GHI-0003', 'shop', 3),
      ('BS-MAT-0004-OW', 'shop', 2), ('BS-MAT-0004-BE', 'shop', 1), ('BS-RAW-0005', 'shop', 4),
      ('BS-BRD-0006', 'shop', 1), ('BS-CSL-0007-SG', 'shop', 6), ('BS-CSL-0007-OP', 'warehouse', 4),
      ('BS-LIN-0008', 'shop', 5), ('BS-MTO-0009', 'shop', 2), ('BS-DRF-0010', 'shop', 1),
      ('BS-FRS-0011', 'warehouse', 120), ('BS-FTS-0012', 'warehouse', 80),
      ('BS-FTS-0012', 'shop', 12.5), ('BS-FMT-0013', 'warehouse', 60),
      ('BS-FLS-0014', 'warehouse', 150), ('BS-FCS-0015', 'warehouse', 200),
      ('BS-STL-0016', 'shop', 5), ('BS-KRT-0017', 'shop', 8), ('BS-DRM-0018', 'shop', 3),
      ('BS-HOM-0019', 'warehouse', 10), ('BS-GHI-0003', 'looms', 2)
    ) as s (sku, loc, qty)
    join public.product_variants v on v.sku = s.sku
  loop
    perform public.apply_stock_adjustment(
      r.id,
      case r.loc when 'shop' then v_shop when 'warehouse' then v_warehouse else v_looms end,
      r.qty::numeric,
      'received',
      'Opening stock (sample)'
    );
  end loop;
end;
$$;

update public.inventory_levels il set low_stock_threshold = 10
  from public.product_variants v
 where v.id = il.variant_id and v.sell_unit = 'metre';

-------------------------------------------------------------------------------
-- Collections: one row for every collection URL in the storefront map
-------------------------------------------------------------------------------
insert into public.collections (section, slug, title, h1, intro, rules, position, status, seo_title, seo_description, faqs) values
  ('root', 'sarees', 'Sarees', 'Handwoven Bhagalpur Silk Sarees',
   'Tussar, matka, ghicha and raw silk sarees woven on the looms of Bhagalpur. Every listing states the fibre of the warp and the weft, and pure-silk pieces show their Silk Mark label number.',
   '{"kinds": ["saree"]}', 1, 'published', 'Bhagalpur Silk Sarees: Tussar, Matka, Ghicha | Bahram Silks',
   'Shop handwoven Bhagalpur silk sarees in tussar, matka, ghicha and raw silk, with honest fibre labels and Silk Mark numbers.',
   '[{"question": "What is the length of a Bhagalpur silk saree?", "answer": "Most of our sarees are 5.5 m with a 0.8 to 1 m blouse piece. Each listing states the exact length and whether a blouse piece is included."}, {"question": "How do I know a saree is pure silk?", "answer": "Pure-silk pieces carry a Silk Mark label whose number is shown on the product page. Blends are labelled as blends, with the fibre of the warp and weft stated."}]'),
  ('root', 'fabric', 'Fabric by the Metre', 'Silk and Linen Fabric by the Metre',
   'Raw silk, tussar, matka, linen-stripe and cotton-silk yardage from Bhagalpur, sold per metre in 0.5 m steps with bulk prices for boutiques and designers. Order swatches before you cut.',
   '{"kinds": ["fabric"]}', 2, 'published', 'Silk Fabric by the Metre from Bhagalpur | Bahram Silks',
   'Buy raw silk, tussar, matka, linen-stripe and cotton-silk fabric per metre, with bulk prices and swatches.',
   '[{"question": "What is the minimum order?", "answer": "One metre, then in 0.5 m steps. Bulk prices start at 10 m."}, {"question": "Can I return cut fabric?", "answer": "Fabric cut to your length cannot be returned, so we recommend ordering a swatch first."}]'),
  ('root', 'stoles-dupattas', 'Stoles and Dupattas', 'Silk Stoles and Dupattas', 'Light tussar and ghicha stoles and dupattas, finished by hand.', '{"kinds": ["stole_dupatta"]}', 3, 'published', 'Tussar Silk Stoles and Dupattas | Bahram Silks', 'Handwoven tussar and ghicha silk stoles and dupattas from Bhagalpur.', '[]'),
  ('root', 'dress-material', 'Suits and Dress Material', 'Silk Suits and Dress Material', 'Unstitched silk dress material sets woven in Bhagalpur.', '{"kinds": ["dress_material"]}', 4, 'published', 'Silk Dress Material and Suit Sets | Bahram Silks', 'Unstitched tussar and matka silk dress material from Bhagalpur.', '[]'),
  ('root', 'kurta-fabric', 'Men''s Kurta Fabric', 'Silk Kurta Fabric for Men', 'Pre-cut lengths of matka, raw and tussar silk for men''s kurtas.', '{"kinds": ["kurta_fabric"]}', 5, 'published', 'Silk Kurta Fabric for Men | Bahram Silks', 'Pre-cut matka, raw and tussar silk kurta fabric from Bhagalpur.', '[]'),
  ('root', 'home-furnishing', 'Home Furnishing', 'Silk Home Furnishing', 'Cushion covers and furnishing in textured ghicha and matka silk.', '{"kinds": ["home_furnishing"]}', 6, 'published', 'Silk Cushion Covers and Furnishing | Bahram Silks', 'Ghicha and matka silk cushion covers and home furnishing from Bhagalpur.', '[]'),
  ('sarees', 'tussar-silk', 'Tussar Silk Sarees', 'Tussar Silk Sarees', 'Tussar is wild silk from the Antheraea mylitta silkworm, fed on forest trees. Its natural gold-copper colour and matte sheen are the signature of Bhagalpur.', '{"kinds": ["saree"], "fibres": ["tussar", "desi_tussar", "handspun_tussar", "munga", "katia"]}', 10, 'published', 'Tussar Silk Sarees from Bhagalpur | Bahram Silks', 'Handwoven tussar silk sarees from Bhagalpur in natural gold and dyed colours.', '[{"question": "Why does tussar look matte?", "answer": "Tussar fibre is flatter and coarser than mulberry silk, so it reflects light softly rather than shining."}]'),
  ('sarees', 'raw-silk', 'Raw Silk Sarees', 'Raw Silk Sarees', 'Raw silk keeps its natural gum, sericin, which gives a firmer, crisper body that holds pleats.', '{"kinds": ["saree"], "fibres": ["raw_silk"]}', 11, 'published', 'Raw Silk Sarees | Bahram Silks', 'Crisp raw silk sarees woven in Bhagalpur.', '[]'),
  ('sarees', 'matka-silk', 'Matka Silk Sarees', 'Matka Silk Sarees', 'Matka is hand-spun from pierced mulberry cocoons. It is rough and slubby with a thick hand, and it is not the same as raw silk.', '{"kinds": ["saree"], "fibres": ["matka"]}', 12, 'published', 'Matka Silk Sarees | Bahram Silks', 'Textured matka silk sarees woven in Bhagalpur.', '[]'),
  ('sarees', 'ghicha-silk', 'Ghicha Silk Sarees', 'Ghicha Silk Sarees', 'Ghicha is tussar yarn drawn by hand from the cocoon without twisting, which gives an irregular, rustic texture.', '{"kinds": ["saree"], "fibres": ["ghicha"]}', 13, 'published', 'Ghicha Silk Sarees | Bahram Silks', 'Rustic, textured ghicha silk sarees from Bhagalpur.', '[]'),
  ('sarees', 'cotton-silk', 'Cotton-Silk Sarees', 'Cotton-Silk Sarees', 'Light, breathable cotton-silk blends for everyday wear, always labelled as blends.', '{"kinds": ["saree"], "fibres": ["cotton_silk", "kota"]}', 14, 'published', 'Cotton-Silk Sarees | Bahram Silks', 'Breathable cotton-silk sarees woven in Bhagalpur.', '[]'),
  ('sarees', 'linen', 'Linen Sarees', 'Linen Sarees', 'Crisp linen sarees woven in Bhagalpur that soften with every wash.', '{"kinds": ["saree"], "fibres": ["linen", "organic_linen"]}', 15, 'published', 'Linen Sarees | Bahram Silks', 'Handwoven linen sarees from Bhagalpur.', '[]'),
  ('sarees', 'zari-bridal', 'Zari and Bridal Sarees', 'Zari and Bridal Silk Sarees', 'Tussar and silk sarees with zari borders and pallus, including single-piece bridal weaves.', '{"kinds": ["saree"], "has_zari": true}', 16, 'published', 'Zari and Bridal Silk Sarees | Bahram Silks', 'Bridal and zari-bordered tussar silk sarees from Bhagalpur.', '[]'),
  ('sarees', 'bhagalpuri-silk', 'Bhagalpuri Silk Sarees', 'Bhagalpur Silk (GI) Sarees', 'Bhagalpur Silk received its Geographical Indication in 2013. Only pieces made by the traditional process for both sourcing and weaving are listed here as Bhagalpur Silk (GI).', '{"kinds": ["saree"], "gi_eligible": true}', 17, 'published', 'Bhagalpuri Silk Sarees, Bhagalpur Silk (GI) | Bahram Silks', 'GI-eligible Bhagalpuri silk sarees woven by the traditional process.', '[{"question": "What does Bhagalpur Silk (GI) mean?", "answer": "Bhagalpur Silk is a protected Geographical Indication (2013). We use the name only for pieces that qualify; others are described as woven in Bhagalpur."}]'),
  ('sarees', 'new-arrivals', 'New Arrivals', 'New Sarees from the Looms', 'Sarees added in the last 60 days. One-of-a-kind pieces sell once; join the waitlist for similar weaves.', '{"kinds": ["saree"], "new_within_days": 60}', 18, 'published', 'New Arrivals: Bhagalpur Silk Sarees | Bahram Silks', 'The latest sarees from our Bhagalpur looms.', '[]'),
  ('fabric', 'raw-silk', 'Raw Silk Fabric', 'Raw Silk Fabric by the Metre', 'Raw silk yardage with natural sericin for structured kurtas, jackets and suits.', '{"kinds": ["fabric"], "fibres": ["raw_silk"]}', 20, 'published', 'Raw Silk Fabric by the Metre | Bahram Silks', 'Buy raw silk fabric per metre from Bhagalpur, with bulk prices.', '[]'),
  ('fabric', 'tussar-silk', 'Tussar Silk Fabric', 'Tussar Silk Fabric by the Metre', 'Natural and dyed tussar yardage, 44 inches wide.', '{"kinds": ["fabric"], "fibres": ["tussar", "desi_tussar", "handspun_tussar", "munga", "katia"]}', 21, 'published', 'Tussar Silk Fabric by the Metre | Bahram Silks', 'Buy tussar silk fabric per metre from Bhagalpur, with bulk prices.', '[]'),
  ('fabric', 'matka-silk', 'Matka Silk Fabric', 'Matka Silk Fabric by the Metre', 'Slubby hand-spun matka yardage for jackets, suits and furnishing.', '{"kinds": ["fabric"], "fibres": ["matka"]}', 22, 'published', 'Matka Silk Fabric by the Metre | Bahram Silks', 'Buy matka silk fabric per metre from Bhagalpur.', '[]'),
  ('fabric', 'linen-stripe', 'Linen Stripe Fabric', 'Linen Stripe Fabric by the Metre', 'Linen grounds with woven silk stripes, in shirting and kurta weights.', '{"kinds": ["fabric"], "fibres": ["linen", "organic_linen"]}', 23, 'published', 'Linen Stripe Fabric by the Metre | Bahram Silks', 'Buy linen-stripe fabric per metre from Bhagalpur.', '[]'),
  ('fabric', 'cotton-silk', 'Cotton-Silk Fabric', 'Cotton-Silk Fabric by the Metre', 'Light cotton-silk blends, labelled as blends, ready to wear or dye.', '{"kinds": ["fabric"], "fibres": ["cotton_silk", "kota"]}', 24, 'published', 'Cotton-Silk Fabric by the Metre | Bahram Silks', 'Buy cotton-silk fabric per metre from Bhagalpur.', '[]'),
  ('fabric', 'swatches', 'Fabric Swatches', 'Order Fabric Swatches', 'See and feel the weave before you cut. Swatches are available for every fabric marked below.', '{"kinds": ["fabric"], "swatch_available": true}', 25, 'published', 'Silk Fabric Swatches | Bahram Silks', 'Order swatches of our raw silk, tussar, matka and linen fabric.', '[]'),
  ('occasion', 'office', 'Office Wear', 'Silk Sarees for Office', 'Light tussar, ghicha, cotton-silk and linen weaves that last a working day.', '{"occasions": ["office"]}', 30, 'published', 'Silk Sarees for Office Wear | Bahram Silks', 'Light, comfortable silk and linen sarees for the office.', '[]'),
  ('occasion', 'festive', 'Festive', 'Festive Silk Sarees', 'Richer colours and zari borders for festivals and celebrations.', '{"occasions": ["festive"]}', 31, 'published', 'Festive Silk Sarees | Bahram Silks', 'Festive tussar and matka silk sarees from Bhagalpur.', '[]'),
  ('occasion', 'wedding', 'Wedding', 'Wedding and Bridal Silk', 'Bridal tussar with zari pallus, and pieces woven to order in your colour.', '{"occasions": ["wedding"]}', 32, 'published', 'Wedding Silk Sarees | Bahram Silks', 'Bridal and wedding silk sarees from Bhagalpur.', '[]'),
  ('occasion', 'puja', 'Puja', 'Silk Sarees for Puja', 'Natural tussar and matka in the colours of ceremony.', '{"occasions": ["puja"]}', 33, 'published', 'Silk Sarees for Puja | Bahram Silks', 'Tussar and matka silk sarees for puja and ceremonies.', '[]'),
  ('occasion', 'gifting', 'Gifting', 'Silk Gifts from Bhagalpur', 'Stoles, sarees and furnishing that arrive boxed with an authenticity card.', '{"occasions": ["gifting"]}', 34, 'published', 'Silk Gifts from Bhagalpur | Bahram Silks', 'Silk gifts from Bhagalpur: stoles, sarees and more.', '[]'),
  ('shop', 'under-3000', 'Under ₹3,000', 'Silk and Linen under ₹3,000', 'Cotton-silk sarees, stoles, kurta lengths and furnishing priced under ₹3,000.', '{"price_max_paise": 300000, "exclude_kinds": ["fabric"]}', 40, 'published', 'Silk under ₹3,000 | Bahram Silks', 'Handwoven pieces from Bhagalpur under ₹3,000.', '[]'),
  ('shop', '3000-to-7000', '₹3,000 to ₹7,000', 'Silk Sarees from ₹3,000 to ₹7,000', 'Tussar, matka, raw silk and linen sarees in our core price band.', '{"price_min_paise": 300000, "price_max_paise": 700001, "exclude_kinds": ["fabric"]}', 41, 'published', 'Silk Sarees ₹3,000 to ₹7,000 | Bahram Silks', 'Handwoven Bhagalpur silk sarees from ₹3,000 to ₹7,000.', '[]'),
  ('shop', 'above-7000', 'Above ₹7,000', 'Silk Sarees above ₹7,000', 'Zari, bridal and made-to-order pieces.', '{"price_min_paise": 700001, "exclude_kinds": ["fabric"]}', 42, 'published', 'Silk Sarees above ₹7,000 | Bahram Silks', 'Bridal, zari and made-to-order silk sarees above ₹7,000.', '[]');

update public.collections c set parent_id = parent.id
  from public.collections parent
 where parent.section = 'root' and parent.slug = c.section and c.section in ('sarees', 'fabric');

-------------------------------------------------------------------------------
-- Reviews
-------------------------------------------------------------------------------
insert into public.reviews (product_id, author_name, author_city, rating, title, body, status, verified_purchase, reply_body, replied_at, created_at)
select p.id, r.author, r.city, r.rating, r.title, r.body, r.status::public.review_status, r.verified,
  r.reply, case when r.reply is not null then now() - interval '2 days' end, now() - make_interval(days => r.days_ago)
from (values
  ('raw-silk-saree-mustard', 'Priya S. (sample)', 'Pune', 5, 'Holds its pleats beautifully', 'Crisp, true to the photos and the Silk Mark tag was on the saree as listed.', 'approved', true, 'Thank you, Priya. We will pass this on to the weaver.', 20),
  ('raw-silk-saree-mustard', 'Neha K. (sample)', 'Delhi', 4, 'Lovely colour', 'The mustard is slightly deeper than on my screen, but I like it more in person.', 'approved', true, null, 15),
  ('cotton-silk-saree-sea-green', 'Asha V. (sample)', 'Bengaluru', 5, 'Perfect for work', 'Light and breathable. Clearly labelled as cotton-silk, which I appreciated.', 'approved', true, null, 10),
  ('raw-silk-fabric-natural', 'Studio Ira (sample)', 'Mumbai', 5, 'Consistent bolts', 'Ordered 25 m for a capsule collection; the swatch matched the bolt exactly.', 'approved', false, null, 30),
  ('matka-silk-saree-temple-border', 'Rohan M. (sample)', 'Kolkata', 4, 'Gift for my mother', 'Good texture, well packed with a care card.', 'approved', true, null, 8),
  ('linen-saree-ivory-silver-border', 'Anonymous (sample)', null, 2, 'Pending moderation', 'Sample review awaiting moderation; it must not appear on the storefront.', 'pending', false, null, 1)
) as r (slug, author, city, rating, title, body, status, verified, reply, days_ago)
join public.products p on p.slug = r.slug;

-------------------------------------------------------------------------------
-- Sample orders (no one-of-a-kind stock is used)
-------------------------------------------------------------------------------
do $$
declare
  v_asha uuid := (select id from public.customers where email = 'asha@shopper.local');
  v_vikram uuid := (select id from public.customers where email = 'vikram@shopper.local');
  v_order uuid;
  v_variant public.product_variants;
begin
  select * into v_variant from public.product_variants where sku = 'BS-CSL-0007-SG';

  insert into public.orders (customer_id, email, phone, status, payment_method, payment_status,
    subtotal_paise, discount_paise, shipping_paise, tax_paise, total_paise, shipping_address, place_of_supply_state_code, placed_at)
  values (v_asha, 'asha@shopper.local', '+919800000101', 'pending_payment', 'upi', 'pending',
    260000, 10000, 0, 11905, 250000,
    '{"full_name": "Asha Verma", "phone": "+919800000101", "line1": "14 Sample Lane", "line2": "Indiranagar", "city": "Bengaluru", "state": "Karnataka", "state_code": "29", "pincode": "560038", "country": "IN"}',
    '29', now() - interval '12 days')
  returning id into v_order;

  insert into public.order_items (order_id, product_id, variant_id, sku, title, variant_title, colour, sell_unit, quantity,
    unit_price_paise, discount_paise, line_total_paise, hsn_code, gst_rate_bps, tax_paise)
  values (v_order, v_variant.product_id, v_variant.id, v_variant.sku, 'Sea Green Cotton-Silk Saree', v_variant.title, v_variant.colour, 'piece', 1,
    260000, 10000, 250000, '5007', 500, 11905);

  perform public.reserve_stock(v_order, jsonb_build_array(jsonb_build_object('variant_id', v_variant.id, 'quantity', 1)));
  insert into public.payments (order_id, method, status, amount_paise, razorpay_order_id, razorpay_payment_id, captured_at)
  values (v_order, 'upi', 'captured', 250000, 'order_SAMPLE0001', 'pay_SAMPLE0001', now() - interval '12 days');
  perform public.commit_reservation(v_order);
  update public.orders set status = 'confirmed', payment_status = 'captured' where id = v_order;
  update public.orders set status = 'packed' where id = v_order;
  update public.orders set status = 'shipped' where id = v_order;
  insert into public.shipments (order_id, courier, service, awb, status, shipped_at, delivered_at)
  values (v_order, 'Sample Courier', 'surface', 'SAMPLEAWB0001', 'delivered', now() - interval '10 days', now() - interval '6 days');
  update public.orders set status = 'delivered' where id = v_order;

  insert into public.orders (customer_id, email, phone, status, payment_method, payment_status,
    subtotal_paise, shipping_paise, cod_fee_paise, tax_paise, total_paise, shipping_address, place_of_supply_state_code, gstin, business_name)
  values (v_vikram, 'vikram@shopper.local', '+919800000102', 'awaiting_cod_confirmation', 'cod', 'pending',
    345000, 0, 4900, 16429, 349900,
    '{"full_name": "Vikram Rao", "phone": "+919800000102", "line1": "2 Sample Studio Road, Bandra West", "city": "Mumbai", "state": "Maharashtra", "state_code": "27", "pincode": "400050", "country": "IN"}',
    '27', '27ABCDE1234F1Z5', 'Sample Studio (boutique)')
  returning id into v_order;

  select * into v_variant from public.product_variants where sku = 'BS-FLS-0014';
  insert into public.order_items (order_id, product_id, variant_id, sku, title, variant_title, colour, sell_unit, quantity,
    unit_price_paise, line_total_paise, hsn_code, gst_rate_bps, tax_paise, returnable)
  values (v_order, v_variant.product_id, v_variant.id, v_variant.sku, 'Linen Stripe Fabric with Tussar Stripes', v_variant.title, v_variant.colour, 'metre', 5,
    69000, 345000, '5309', 500, 16429, false);

  perform public.reserve_stock(v_order, jsonb_build_array(jsonb_build_object('variant_id', v_variant.id, 'quantity', 5)));
  perform public.commit_reservation(v_order);
  update public.orders set status = 'confirmed', cod_confirmed_at = now() where id = v_order;
end;
$$;

-------------------------------------------------------------------------------
-- CMS: legal and help page drafts, home sections, navigation, announcement, banner
-------------------------------------------------------------------------------
create temporary table seed_pages (slug text, kind text, title text, seo_description text, body text);
insert into seed_pages values
  ('legal/terms', 'legal', 'Terms of Use',
   'The terms that apply when you browse and buy from Bahram Silks.',
   '<p><strong>Draft for legal review.</strong> TODO(client): confirm with counsel before launch.</p>
<h2>Who we are</h2><p>This website is operated by Bahram Raw Silk (GSTIN 10AAFFB7503A1ZF), Hossainabad, Bounsi Road, Near Jama Masjid, Bhagalpur 812005, Bihar, India, an inventory e-commerce entity selling its own stock woven in Bhagalpur, Bihar.</p>
<h2>Products and descriptions</h2><p>We state the fibre of the warp and weft for every product. "Silk Mark", "Handloom" and "Bhagalpur Silk (GI)" are shown only where we hold the matching label or qualification. Handwoven pieces vary slightly in colour and texture; these variations are part of the craft, not defects.</p>
<h2>Prices</h2><p>Prices are in Indian rupees and include GST. Shipping, cash-on-delivery and gift-wrap charges are shown before you pay. A struck-through prior price is shown only when the item was genuinely sold at that price.</p>
<h2>Orders</h2><p>An order is accepted when payment is captured, or for cash on delivery when you confirm the order with us. We may cancel an order and refund you in full if a piece is unavailable.</p>
<h2>Grievances</h2><p>Contact our Grievance Officer through the grievance page. We acknowledge complaints within 48 hours and aim to resolve them within one month.</p>'),
  ('legal/privacy', 'legal', 'Privacy Notice',
   'How Bahram Silks collects, uses and protects your personal data.',
   '<p><strong>Draft for legal review.</strong> TODO(client): confirm with counsel against the DPDP Act 2023 and Rules 2025.</p>
<h2>What we collect</h2><p>Your name, contact details and delivery address to fulfil orders; payment status from our payment gateway (we never see or store card details); and, only if you agree, analytics cookies.</p>
<h2>Consent, purpose by purpose</h2><p>We ask separately for order updates, marketing by email, WhatsApp or SMS, and analytics. Marketing is always opt-in. You can withdraw any consent from your account as easily as you gave it.</p>
<h2>Your rights</h2><p>You can ask to access, correct or erase your personal data from the privacy page in your account. Records we must keep by law, such as tax invoices, are retained for the required period.</p>
<h2>Contact</h2><p>Write to the Grievance Officer named on the grievance page.</p>'),
  ('legal/shipping-policy', 'legal', 'Shipping Policy',
   'Where we deliver, how long it takes and what it costs.',
   '<p><strong>Draft for legal review.</strong></p>
<h2>Dispatch</h2><p>Ready pieces are dispatched within 24 to 48 hours. Made-to-order pieces show their lead time on the product page.</p>
<h2>Delivery</h2><p>We ship across India through courier partners. Enter your PIN code on any product page to see the delivery estimate and whether cash on delivery is available.</p>
<h2>Charges</h2><p>Shipping is calculated at checkout and shown before you pay. Orders above the free-shipping threshold ship free.</p>
<h2>Failed delivery</h2><p>If a delivery attempt fails, we contact you to arrange another attempt before the parcel is returned to us.</p>'),
  ('legal/returns-policy', 'legal', 'Returns and Exchanges Policy',
   'Returns, exchanges and refunds at Bahram Silks.',
   '<p><strong>Draft for legal review.</strong></p>
<h2>Window</h2><p>Request a return or exchange within 7 days of delivery for unused items with tags and labels intact.</p>
<h2>Exchange first</h2><p>We offer an exchange or store credit with free reverse pickup. If you prefer, we refund to your original payment method.</p>
<h2>Not returnable</h2><p>Fabric cut to your length, stitched-to-measure items and made-to-order pieces (except for defects), and items marked final sale before purchase.</p>
<h2>Quality check</h2><p>Returned pieces are checked for wear, perfume, stains and removed labels before a refund or credit is issued. For damage or wrong-item claims, please share an unboxing video.</p>'),
  ('legal/cancellation', 'legal', 'Cancellation Policy',
   'How to cancel an order and how refunds work.',
   '<p><strong>Draft for legal review.</strong></p>
<h2>Before dispatch</h2><p>You can cancel any order before it is packed from your account or by contacting us. Prepaid orders are refunded to the original payment method.</p>
<h2>After dispatch</h2><p>Once shipped, an order cannot be cancelled, but you can request a return after delivery under the returns policy.</p>
<h2>Made-to-order</h2><p>Made-to-order pieces can be cancelled free of charge until weaving begins; we will tell you when that happens.</p>'),
  ('help/shipping', 'help', 'Shipping',
   'Dispatch times, delivery estimates and charges.',
   '<p>Ready pieces leave Bhagalpur within 24 to 48 hours. Check delivery time and cash-on-delivery availability for your PIN code on any product page. Every saree travels folded in acid-free tissue inside a cotton pouch and a rigid box.</p>'),
  ('help/returns', 'help', 'Returns and Exchanges',
   'How to start a return or exchange.',
   '<p>Start a return from your order page within 7 days of delivery. We arrange a free reverse pickup and offer an exchange, store credit or a refund to source.</p>'),
  ('help/faq', 'help', 'Frequently Asked Questions',
   'Answers about silk, sizing, payment and delivery.',
   '<h2>Is your silk pure?</h2><p>Pure-silk pieces carry a Silk Mark label; its number is on the product page. Blends are labelled as blends.</p>
<h2>Do you offer cash on delivery?</h2><p>Yes, for orders up to ₹5,000 on serviceable PIN codes, with a small COD fee shown upfront. We confirm COD orders by WhatsApp or phone before dispatch.</p>
<h2>Why do handwoven sarees vary?</h2><p>Hand-reeled tussar and hand-spun matka are naturally uneven. Slubs and slight colour variation are signs of handwork.</p>'),
  ('our-story', 'craft', 'Our story: Bahram Raw Silk, Bhagalpur',
   'Bahram Raw Silk makes handloom tussar, raw silk and cotton-silk sarees, dress material and furnishing fabric in Bhagalpur. Bahram Silks is our online shop.',
   '<p>Bahram Raw Silk is a manufacturer and exporter of handloom silk in Bhagalpur, Bihar, the Silk City of India. From Hossainabad on Bounsi Road we make tussar, raw silk, cotton-silk and linen-silk sarees, dress material and salwar suits, and furnishing, drapery and other handwoven fabrics.</p>
<p>Bahram Silks is our online shop. It lets us sell the cloth we make straight to you, without middlemen, and with the proof on every page: the fibre in warp and weft, Silk Mark and Handloom Mark numbers wherever a piece carries them, and the name of the weaver when they agree to be credited.</p>
<h2>Woven in Bhagalpur</h2>
<p>Bhagalpur is home to thousands of handloom weavers in Nathnagar, Champanagar, Mirzafari and the neighbouring mohallas. Tussar leads, with its natural gold sheen, followed by ghicha, matka and raw silk. Read <a href="/guides/bhagalpur-silk-guide">our Bhagalpur silk guide</a> to learn how each is made and how to recognise an original piece.</p>
<h2>Sarees, fabric and bulk orders</h2>
<p>Shop <a href="/sarees">Bhagalpur silk sarees</a> and <a href="/fabric">silk fabric by the metre</a> online. Boutiques, designers and exporters can <a href="/contact">contact us</a> for bulk quantities and custom weaving.</p>
<h2>Visit us</h2>
<p>Bahram Raw Silk, Hossainabad, Bounsi Road, near Jama Masjid, Bhagalpur 812005, Bihar, India. Phone +91-9801616789. Please call before you visit.</p>'),
  ('guides/bhagalpur-silk-guide', 'craft', 'The Bhagalpur Silk Guide',
   'What Bhagalpur silk is, the yarns woven in India''s Silk City, the 2013 GI tag, and how to tell an original Bhagalpuri silk saree from a copy.',
   '<p>Bhagalpur, on the southern bank of the Ganga in Bihar, is known as the Silk City of India. Its weavers have worked tussar and other silks for generations, and "Bhagalpuri silk" is one of the best-known saree names in the country. It is also one of the most copied. This guide explains what Bhagalpur silk is, how it is made, what the GI tag means and how to buy an original piece.</p>
<p><em>Written by Bahram Raw Silk, manufacturers and exporters of handloom silk in Hossainabad, Bhagalpur.</em></p>
<h2>What is Bhagalpur silk?</h2>
<p>Bhagalpur silk is silk cloth woven in and around Bhagalpur. When people say "Bhagalpuri silk" they usually mean tussar: a wild silk with a natural gold-to-honey sheen, a slightly dry hand and a soft, textured drape. Bhagalpur''s weavers also work ghicha, matka and raw (mulberry) silk, and blends such as cotton-silk and linen-silk.</p>
<p>"Bhagalpur silk" and "Bhagalpuri silk" mean the same thing; Bhagalpuri is simply the adjective. The name tells you where a piece was woven, not what it is made of, so always read the fibre in the warp and the weft.</p>
<h2>The yarns woven in Bhagalpur</h2>
<h3>Tussar silk</h3>
<p>Tussar (also spelt tasar or tussah) comes from wild silkworms, mainly <em>Antheraea mylitta</em>, that feed on arjun, asan and sal trees in the forests of eastern and central India. Jharkhand is the country''s largest producer. The cocoons are gathered from the trees rather than raised indoors. Tussar yarn has a natural colour that runs from pale beige to deep copper, which is why many tussar sarees are left undyed. It is lighter and more breathable than mulberry silk, with a soft gold glow rather than a high shine. <a href="/sarees/tussar-silk">Shop tussar silk sarees</a>.</p>
<h3>Ghicha silk</h3>
<p>Ghicha is a thick, uneven tussar yarn drawn by hand from cocoons that cannot be reeled into one long filament. Because the yarn varies along its length, ghicha cloth has a rough, slubbed texture and an earthy look. It is often woven as the weft across a finer tussar warp. <a href="/sarees/ghicha-silk">Shop ghicha silk sarees</a>.</p>
<h3>Matka silk</h3>
<p>Matka is a coarse yarn hand-spun from the short mulberry silk fibres left over from reeling, without removing all of the natural gum. That gives matka its heavy, nubby hand and a muted lustre. It holds its shape well, so it is popular for sarees, kurtas and jackets. <a href="/sarees/matka-silk">Shop matka silk sarees</a>.</p>
<h3>Raw silk</h3>
<p>In the Indian market, "raw silk" usually means mulberry silk woven before the natural gum (sericin) is fully washed out. It feels crisp, with a gentle sheen that softens as the cloth is worn and washed. Mulberry silk comes from the domesticated <em>Bombyx mori</em> silkworm. <a href="/sarees/raw-silk">Shop raw silk sarees</a>.</p>
<h3>Blends</h3>
<p>Cotton-silk, linen-silk and art-silk sarees are also sold as "Bhagalpuri". They can be lovely to wear and kinder on the budget, but they are not pure silk, and an honest seller says so on the label.</p>
<h2>How a Bhagalpur silk saree is made</h2>
<ol>
<li><strong>Cocoons.</strong> Tussar cocoons come from forest-rearing areas in Jharkhand, Bihar and neighbouring states; mulberry yarn and silk waste come from India''s mulberry belts.</li>
<li><strong>Reeling and spinning.</strong> Cocoons are cooked to soften the gum and reeled into filament yarn, or the leftover fibre is hand-spun into ghicha and matka.</li>
<li><strong>Dyeing.</strong> Yarn is left in its natural colour or dyed before weaving.</li>
<li><strong>Warping.</strong> Thousands of warp threads are measured, sized and set on the loom.</li>
<li><strong>Weaving.</strong> The weaver passes the weft through the warp by hand, building the body, border and pallu. A plain saree takes days on a handloom; a patterned one takes longer.</li>
<li><strong>Finishing.</strong> The saree is checked, washed or finished, and folded for sale.</li>
</ol>
<h2>Where silk is woven in Bhagalpur</h2>
<p>Most of the weaving happens in mohallas such as Nathnagar, Champanagar and Mirzafari, and in villages around the city. Many households keep a loom at home, and the trade runs through master weavers and manufacturers who buy yarn, give out work and sell the finished cloth across India and abroad.</p>
<h2>The GI tag: what "Bhagalpur Silk (GI)" means</h2>
<p>"Bhagalpur Silk" was registered as a Geographical Indication (GI) in 2013. A GI protects a name that is tied to a place and its traditional way of making: only goods made in the defined area by the registered method may use it. A GI is about origin and method; on its own it does not certify that a particular saree is pure silk.</p>
<p>On this site, the "Bhagalpur Silk (GI)" badge appears only on products we have recorded as GI-eligible. Other pieces are described as "woven in Bhagalpur".</p>
<h2>Silk Mark and Handloom Mark</h2>
<p>The Silk Mark is a quality label from the Silk Mark Organisation of India, set up by the Central Silk Board under the Ministry of Textiles. Each label carries a unique number and confirms that the product is made of natural silk. The Handloom Mark confirms that the cloth was woven on a handloom. Ask for both, and check that the label belongs to the piece in front of you.</p>
<h2>How to identify an original Bhagalpuri silk saree</h2>
<ul>
<li><strong>Read the label.</strong> A good seller states the fibre of the warp and the weft, for example "tussar warp, ghicha weft". "Bhagalpuri" on its own is a place, not a fibre.</li>
<li><strong>Look for the Silk Mark</strong> on any piece sold as pure silk.</li>
<li><strong>Look at the texture.</strong> Handwoven tussar and ghicha show slubs, small changes in thickness and an uneven natural gold. A perfectly even, mirror-like shine at a very low price usually means polyester or art silk.</li>
<li><strong>Feel it.</strong> Pure silk warms quickly in the hand; polyester feels slippery and stays cool.</li>
<li><strong>Try a burn test on a single thread</strong>, never on the saree. Silk burns slowly, smells like burning hair and leaves a soft ash that crumbles to powder. Polyester melts, smells of plastic and leaves a hard bead.</li>
<li><strong>Check the price.</strong> Pure tussar yarn and days of skilled weaving cost real money. If a "pure Bhagalpuri silk saree" costs less than its yarn would, it is not one.</li>
<li><strong>Buy close to the loom.</strong> Weavers and manufacturers in Bhagalpur can tell you which yarn went into a piece and who wove it.</li>
</ul>
<h2>Choosing a silk shop in Bhagalpur</h2>
<p>Bhagalpur has many silk shops around its weaving localities and markets. Whoever you buy from, a good shop states the warp and weft fibres, shows Silk Mark labels on pure silk, lets you see the cloth in daylight and explains the price.</p>
<p>Our shop, Bahram Raw Silk, is at Hossainabad, Bounsi Road, near Jama Masjid, Bhagalpur 812005, Bihar. We make tussar, raw silk, cotton-silk and linen-silk sarees, dress material, and furnishing and drapery fabrics. Please call +91-9801616789 before you visit, or <a href="/contact">contact us</a> to see a piece on video.</p>
<h2>Caring for Bhagalpur silk</h2>
<ul>
<li>Dry-clean the first few times, especially dyed and zari pieces.</li>
<li>If you hand-wash plain tussar or matka, use cold water and a mild detergent, and never wring.</li>
<li>Dry in the shade: sunlight fades both natural tussar gold and dyes.</li>
<li>Iron on the reverse at a low silk setting, with a cotton cloth in between.</li>
<li>Store folded in muslin or cotton, not plastic, and refold every few months so the creases do not set. Keep zari away from perfume and damp.</li>
</ul>
<h2>Shop Bhagalpur silk from the loom</h2>
<p>Browse <a href="/sarees/bhagalpuri-silk">all Bhagalpuri silk sarees</a>, or shop by yarn: <a href="/sarees/tussar-silk">tussar</a>, <a href="/sarees/ghicha-silk">ghicha</a>, <a href="/sarees/matka-silk">matka</a> and <a href="/sarees/raw-silk">raw silk</a>. Designers, boutiques and tailors can buy <a href="/fabric">silk fabric by the metre</a>, or <a href="/contact">contact us</a> about bulk and export orders.</p>');

do $$
declare
  r record;
  v_page uuid;
  v_version uuid;
begin
  for r in select * from seed_pages loop
    insert into public.pages (slug, kind, title, status, seo_title, seo_description)
    values (r.slug, r.kind, r.title, 'published', r.title || ' | Bahram Silks', r.seo_description)
    returning id into v_page;
    insert into public.page_versions (page_id, version, title, body_html, change_summary, effective_from, created_by)
    values (v_page, 1, r.title, r.body, 'Initial draft for review', current_date, '00000000-0000-4000-a000-000000000001')
    returning id into v_version;
    update public.pages set current_version_id = v_version where id = v_page;
  end loop;
end;
$$;

insert into public.home_sections (type, title, subtitle, config, position) values
  ('hero', 'Bhagalpur silk sarees and fabric, certified pure.', 'Sold by the hands that made it.',
   '{"image_path": "home/hero-loom.webp", "alt": "Tussar silk on a pit loom in Bhagalpur", "cta_label": "Shop tussar sarees", "cta_href": "/sarees/tussar-silk"}', 0),
  ('proof_strip', 'Why Bahram', null,
   '{"items": [{"icon": "badge-check", "label": "Silk Mark numbers on every pure-silk piece"}, {"icon": "map-pin", "label": "Bhagalpur Silk (GI) where it qualifies"}, {"icon": "hand", "label": "Handwoven, Handloom Mark where labelled"}, {"icon": "users", "label": "Direct from the weaver"}]}', 1),
  ('shop_by_fabric', 'Shop by fabric', null,
   '{"tiles": [{"label": "Tussar", "href": "/sarees/tussar-silk"}, {"label": "Matka", "href": "/sarees/matka-silk"}, {"label": "Ghicha", "href": "/sarees/ghicha-silk"}, {"label": "Raw silk", "href": "/sarees/raw-silk"}, {"label": "Cotton-silk", "href": "/sarees/cotton-silk"}, {"label": "Linen", "href": "/sarees/linen"}]}', 2),
  ('collection_carousel', 'New from the looms', null, '{"collection_path": "/sarees/new-arrivals", "limit": 8}', 3),
  ('bestsellers', 'Bestsellers', null, '{"limit": 8}', 4),
  ('weaver_story', 'Meet the weavers', 'Every piece credits the hands that wove it.', '{"weaver_slugs": ["sample-weaver-nathnagar", "sample-weaver-champanagar"], "cta_href": "/weavers"}', 5),
  ('reviews', 'What customers say', null, '{"limit": 6, "min_rating": 4}', 6),
  ('collection_carousel', 'Fabric by the metre', 'For boutiques, designers and home sewists.', '{"collection_path": "/fabric", "limit": 8}', 7);

insert into public.navigation_menus (handle, title, items) values
  ('header', 'Main navigation', '[
    {"label": "Sarees", "href": "/sarees", "children": [
      {"label": "Tussar", "href": "/sarees/tussar-silk"}, {"label": "Matka", "href": "/sarees/matka-silk"},
      {"label": "Ghicha", "href": "/sarees/ghicha-silk"}, {"label": "Raw silk", "href": "/sarees/raw-silk"},
      {"label": "Cotton-silk", "href": "/sarees/cotton-silk"}, {"label": "Linen", "href": "/sarees/linen"},
      {"label": "Zari and bridal", "href": "/sarees/zari-bridal"}, {"label": "Bhagalpuri silk", "href": "/sarees/bhagalpuri-silk"},
      {"label": "New arrivals", "href": "/sarees/new-arrivals"}]},
    {"label": "Fabric", "href": "/fabric", "children": [
      {"label": "Raw silk", "href": "/fabric/raw-silk"}, {"label": "Tussar", "href": "/fabric/tussar-silk"},
      {"label": "Matka", "href": "/fabric/matka-silk"}, {"label": "Linen stripe", "href": "/fabric/linen-stripe"},
      {"label": "Cotton-silk", "href": "/fabric/cotton-silk"}, {"label": "Swatches", "href": "/fabric/swatches"}]},
    {"label": "More", "href": "/stoles-dupattas", "children": [
      {"label": "Stoles and dupattas", "href": "/stoles-dupattas"}, {"label": "Suits and dress material", "href": "/dress-material"},
      {"label": "Men''s kurta fabric", "href": "/kurta-fabric"}, {"label": "Home furnishing", "href": "/home-furnishing"}]},
    {"label": "Occasion", "href": "/occasion/festive", "children": [
      {"label": "Office", "href": "/occasion/office"}, {"label": "Festive", "href": "/occasion/festive"},
      {"label": "Wedding", "href": "/occasion/wedding"}, {"label": "Puja", "href": "/occasion/puja"},
      {"label": "Gifting", "href": "/occasion/gifting"}]},
    {"label": "Price", "href": "/shop/3000-to-7000", "children": [
      {"label": "Under ₹3,000", "href": "/shop/under-3000"}, {"label": "₹3,000 to ₹7,000", "href": "/shop/3000-to-7000"},
      {"label": "Above ₹7,000", "href": "/shop/above-7000"}]},
    {"label": "The craft", "href": "/our-story", "children": [
      {"label": "Our story", "href": "/our-story"}, {"label": "Our weavers", "href": "/weavers"},
      {"label": "Bhagalpur silk guide", "href": "/guides/bhagalpur-silk-guide"},
      {"label": "Silk types explained", "href": "/guides/silk-types-explained"},
      {"label": "How to verify Silk Mark", "href": "/guides/how-to-verify-silk-mark"},
      {"label": "Saree care", "href": "/guides/saree-care"}, {"label": "Journal", "href": "/journal"}]}
  ]'),
  ('footer_shop', 'Shop', '[{"label": "Sarees", "href": "/sarees"}, {"label": "Fabric by the metre", "href": "/fabric"}, {"label": "Stoles and dupattas", "href": "/stoles-dupattas"}, {"label": "New arrivals", "href": "/sarees/new-arrivals"}, {"label": "Bulk and boutique enquiries", "href": "/bulk-enquiries"}]'),
  ('footer_help', 'Help', '[{"label": "Shipping", "href": "/help/shipping"}, {"label": "Returns and exchanges", "href": "/help/returns"}, {"label": "Track order", "href": "/track-order"}, {"label": "FAQ", "href": "/help/faq"}, {"label": "Contact", "href": "/contact"}]'),
  ('footer_legal', 'Legal', '[{"label": "Terms of use", "href": "/legal/terms"}, {"label": "Privacy notice", "href": "/legal/privacy"}, {"label": "Shipping policy", "href": "/legal/shipping-policy"}, {"label": "Returns policy", "href": "/legal/returns-policy"}, {"label": "Cancellation policy", "href": "/legal/cancellation"}, {"label": "Grievance officer", "href": "/grievance"}]'),
  ('footer_craft', 'The craft', '[{"label": "Our story", "href": "/our-story"}, {"label": "Our weavers", "href": "/weavers"}, {"label": "Bhagalpur silk guide", "href": "/guides/bhagalpur-silk-guide"}, {"label": "Journal", "href": "/journal"}]');

insert into public.announcements (message, href, position) values
  ('Pay online and save ₹100. Cash on delivery available up to ₹5,000.', '/help/shipping', 0),
  ('Every pure-silk piece shows its Silk Mark number.', '/guides/how-to-verify-silk-mark', 1);

insert into public.banners (placement, title, subtitle, cta_label, cta_href, image_path, alt, position) values
  ('home_hero', 'The tussar edit', 'Natural gold, woven in Nathnagar.', 'Shop tussar', '/sarees/tussar-silk',
   'banners/tussar-edit.webp', 'Natural gold tussar saree draped over a loom', 0);

insert into public.coupons (code, type, percent_bps, max_discount_paise, min_order_paise, description, usage_limit_per_customer, first_order_only)
values ('WELCOME10', 'percentage', 1000, 50000, 200000, 'Sample: 10% off your first order above ₹2,000, up to ₹500.', 1, true);

drop table seed_products;
drop table seed_pages;
-- Keyword-led SEO titles (the loop above defaults to '<title> | Bahram Silks').
update public.pages set seo_title = 'Bhagalpur Silk Guide: Bhagalpuri Sarees, GI Tag & How to Buy' where slug = 'guides/bhagalpur-silk-guide';
update public.pages set seo_title = 'About Bahram Raw Silk, Silk Manufacturers in Bhagalpur' where slug = 'our-story';

-------------------------------------------------------------------------------
-- DEMO DATA: ~40 historical orders over the last 30 days so the admin dashboard, orders and
-- reports have something realistic to show. Deterministic (setseed) so every reset matches.
-- These are past sales: inventory is not adjusted. Remove this block before importing real data.
-------------------------------------------------------------------------------
do $$
declare
  v_names text[] := array['Priya Sharma','Ananya Iyer','Meera Nair','Kavita Singh','Ritu Agarwal',
    'Sunita Das','Neha Gupta','Pooja Banerjee','Shreya Mukherjee','Deepa Menon','Lakshmi Rao','Farah Khan'];
  v_cities jsonb := '[
    {"city":"Kolkata","state":"West Bengal","state_code":"19","pincode":"700019"},
    {"city":"Patna","state":"Bihar","state_code":"10","pincode":"800001"},
    {"city":"New Delhi","state":"Delhi","state_code":"07","pincode":"110017"},
    {"city":"Bengaluru","state":"Karnataka","state_code":"29","pincode":"560038"},
    {"city":"Mumbai","state":"Maharashtra","state_code":"27","pincode":"400050"},
    {"city":"Bhagalpur","state":"Bihar","state_code":"10","pincode":"812001"},
    {"city":"Chennai","state":"Tamil Nadu","state_code":"33","pincode":"600017"},
    {"city":"Pune","state":"Maharashtra","state_code":"27","pincode":"411001"}]';
  v_customers uuid[] := '{}';
  v_cust uuid;
  v_name text;
  v_city jsonb;
  v_variant record;
  v_order uuid;
  v_age interval;
  v_placed timestamptz;
  v_qty numeric;
  v_line integer;
  v_sub integer;
  v_disc integer;
  v_ship integer;
  v_cod integer;
  v_tax integer;
  v_method public.payment_method;
  v_status public.order_status;
  v_pay public.payment_status;
  r double precision;
  i integer;
begin
  perform setseed(0.42);

  for i in 1 .. array_length(v_names, 1) loop
    insert into public.customers (email, phone, full_name, tags)
    values (lower(replace(v_names[i], ' ', '.')) || '@demo.local', '+9198000' || lpad((200 + i)::text, 5, '0'),
      v_names[i], case when i % 5 = 0 then array['vip'] else '{}' end)
    returning id into v_cust;
    v_customers := v_customers || v_cust;
  end loop;

  for i in 1 .. 40 loop
    v_age := (random() * 30) * interval '1 day';
    v_placed := now() - v_age;
    v_cust := v_customers[1 + floor(random() * array_length(v_customers, 1))::int];
    select full_name into v_name from public.customers where id = v_cust;
    v_city := v_cities -> floor(random() * jsonb_array_length(v_cities))::int;

    select v.*, p.title as product_title, p.hsn_code, p.gst_rate_bps, p.id as pid
      into v_variant
      from public.product_variants v join public.products p on p.id = v.product_id
     where p.status = 'published' and v.active and not p.is_one_of_a_kind
     order by random() limit 1;

    v_qty := case when v_variant.sell_unit = 'metre' then 2 + floor(random() * 5) else 1 end;
    v_line := round(v_variant.price_paise * v_qty);
    v_sub := v_line;

    r := random();
    v_method := case when r < 0.45 then 'upi' when r < 0.62 then 'card' when r < 0.68 then 'netbanking' else 'cod' end;
    v_cod := case when v_method = 'cod' then 4900 else 0 end;
    v_disc := case when v_method = 'cod' then 0 else 10000 end; -- prepaid incentive
    v_ship := case when v_sub >= 250000 then 0 else 9900 end;
    v_tax := round((v_line - v_disc) * 500.0 / 10500);

    -- Older orders have progressed further through the lifecycle.
    r := random();
    v_status := case
      when v_age > interval '9 days' then
        case when r < 0.78 then 'delivered' when r < 0.86 then 'return_requested' when r < 0.93 then 'cancelled' else 'rto' end
      when v_age > interval '4 days' then
        case when r < 0.4 then 'delivered' when r < 0.75 then 'shipped' when r < 0.9 then 'out_for_delivery' else 'delivery_failed' end
      when v_age > interval '1 day' then
        case when r < 0.5 then 'packed' else 'confirmed' end
      else
        case when v_method = 'cod' then 'awaiting_cod_confirmation' when r < 0.3 then 'pending_payment' else 'confirmed' end
    end;
    v_pay := case
      when v_status = 'pending_payment' then 'pending'
      when v_status = 'cancelled' then case when v_method = 'cod' then 'pending' else 'refunded' end
      when v_method = 'cod' then case when v_status = 'delivered' then 'captured' else 'pending' end
      else 'captured' end;

    insert into public.orders (customer_id, email, phone, status, payment_method, payment_status, source,
      subtotal_paise, discount_paise, shipping_paise, cod_fee_paise, tax_paise, total_paise,
      shipping_address, place_of_supply_state_code, placed_at, confirmed_at, cod_confirmed_at,
      shipped_at, delivered_at, cancelled_at, cancel_reason, created_at)
    values (v_cust, (select email from public.customers where id = v_cust), (select phone from public.customers where id = v_cust),
      v_status, v_method, v_pay, case when i % 9 = 0 then 'phone' else 'web' end,
      v_sub, v_disc, v_ship, v_cod, v_tax, v_sub - v_disc + v_ship + v_cod,
      jsonb_build_object('full_name', v_name, 'line1', (10 + i) || ' Demo Street', 'country', 'IN') || v_city,
      v_city ->> 'state_code', v_placed,
      case when v_status not in ('pending_payment', 'awaiting_cod_confirmation') then v_placed + interval '20 minutes' end,
      case when v_method = 'cod' and v_status not in ('awaiting_cod_confirmation', 'cancelled') then v_placed + interval '2 hours' end,
      case when v_status in ('shipped', 'out_for_delivery', 'delivery_failed', 'delivered', 'return_requested', 'rto') then v_placed + interval '1 day' end,
      case when v_status in ('delivered', 'return_requested') then v_placed + interval '5 days' end,
      case when v_status = 'cancelled' then v_placed + interval '3 hours' end,
      case when v_status = 'cancelled' then 'Customer changed their mind before dispatch' end,
      v_placed)
    returning id into v_order;

    insert into public.order_items (order_id, product_id, variant_id, sku, title, variant_title, colour, sell_unit, quantity,
      unit_price_paise, discount_paise, line_total_paise, hsn_code, gst_rate_bps, tax_paise, created_at)
    values (v_order, v_variant.pid, v_variant.id, v_variant.sku, v_variant.product_title, v_variant.title, v_variant.colour,
      v_variant.sell_unit, v_qty, v_variant.price_paise, v_disc, v_line - v_disc, v_variant.hsn_code, v_variant.gst_rate_bps, v_tax, v_placed);

    if v_method <> 'cod' and v_status <> 'pending_payment' then
      insert into public.payments (order_id, method, status, amount_paise, razorpay_order_id, razorpay_payment_id, captured_at, created_at)
      values (v_order, v_method, case when v_status = 'cancelled' then 'refunded'::public.payment_status else 'captured' end,
        v_sub - v_disc + v_ship, 'order_DEMO' || lpad(i::text, 4, '0'), 'pay_DEMO' || lpad(i::text, 4, '0'), v_placed + interval '1 minute', v_placed);
    end if;

    if v_status in ('shipped', 'out_for_delivery', 'delivery_failed', 'delivered', 'return_requested', 'rto') then
      insert into public.shipments (order_id, courier, service, awb, status, cod_amount_paise, shipped_at, delivered_at, ndr_count, ndr_reason, created_at)
      values (v_order, case when i % 2 = 0 then 'Delhivery' else 'Blue Dart' end, case when v_ship = 0 then 'air' else 'surface' end,
        'DEMOAWB' || lpad(i::text, 6, '0'),
        case v_status when 'delivered' then 'delivered' when 'return_requested' then 'delivered' when 'rto' then 'rto_delivered'
          when 'delivery_failed' then 'ndr' when 'out_for_delivery' then 'out_for_delivery' else 'in_transit' end,
        case when v_method = 'cod' then v_sub + v_ship + v_cod else 0 end,
        v_placed + interval '1 day',
        case when v_status in ('delivered', 'return_requested') then v_placed + interval '5 days' end,
        case when v_status in ('delivery_failed', 'rto') then 1 else 0 end,
        case when v_status in ('delivery_failed', 'rto') then 'Customer not available' end,
        v_placed + interval '1 day');
    end if;

    if v_status = 'return_requested' then
      insert into public.returns (order_id, customer_id, status, resolution, reason, customer_comment, created_at)
      values (v_order, v_cust, 'requested', 'exchange', 'Colour different from photos',
        'The shade is a little darker than on my phone. Could I exchange it for the lighter one?', v_placed + interval '6 days');
    end if;
  end loop;
end;
$$;

-- DEMO DATA: one open grievance and one privacy request, to show the SLA tracking screens.
insert into public.grievances (name, email, phone, order_number, category, subject, description, created_at)
values ('Ritu Agarwal', 'ritu.agarwal@demo.local', '+919800000205', 'BS100018', 'delivery',
  'Parcel returned without a delivery attempt',
  'The courier marked my order as undeliverable but nobody called me. I was home all day. Please resend.',
  now() - interval '30 hours');

insert into public.data_requests (email, type, status, details, created_at)
values ('meera.nair@demo.local', 'access', 'received', 'Please send me a copy of the personal data you hold about me.', now() - interval '2 days');
