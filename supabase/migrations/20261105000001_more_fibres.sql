-- More fibre / yarn options for main fibre, warp and weft (client list, 2026-11-05).
-- Appended in the same order as FIBRES in src/lib/domain/enums.ts. Classification (which of
-- these count as 100% silk) lives in src/lib/domain/claims/fibres.ts, not in the database.

-- Silk
alter type public.fibre add value if not exists 'silk';
alter type public.fibre add value if not exists 'desi_tussar';
alter type public.fibre add value if not exists 'handspun_tussar';
alter type public.fibre add value if not exists 'munga';
alter type public.fibre add value if not exists 'katia';
alter type public.fibre add value if not exists 'dupion';
alter type public.fibre add value if not exists 'spun_silk';
alter type public.fibre add value if not exists 'throwster';
-- Silk blends
alter type public.fibre add value if not exists 'silk_blend';
alter type public.fibre add value if not exists 'modal_silk';
alter type public.fibre add value if not exists 'kota';
-- Cotton and linen
alter type public.fibre add value if not exists 'organic_linen';
alter type public.fibre add value if not exists 'mercerised_cotton';
alter type public.fibre add value if not exists 'khadi';
-- Man-made
alter type public.fibre add value if not exists 'viscose';
alter type public.fibre add value if not exists 'handspun_viscose';
alter type public.fibre add value if not exists 'modal';
alter type public.fibre add value if not exists 'polyester';
alter type public.fibre add value if not exists 'staple';
alter type public.fibre add value if not exists 'rollex';
-- Metallic
alter type public.fibre add value if not exists 'zari';
-- Yarn types (fibre not stated)
alter type public.fibre add value if not exists 'handspun_yarn';
alter type public.fibre add value if not exists 'slub';

-- Fibre collections take in the new varieties of their fibre. Rules are jsonb text, so the new
-- enum values are not used in this transaction. Only rules still at their seeded value change;
-- anything staff have edited is left alone.
update public.collections
  set rules = jsonb_set(rules, '{fibres}', '["tussar", "desi_tussar", "handspun_tussar", "munga", "katia"]')
  where path in ('/sarees/tussar-silk', '/fabric/tussar-silk') and rules -> 'fibres' = '["tussar"]';
update public.collections
  set rules = jsonb_set(rules, '{fibres}', '["linen", "organic_linen"]')
  where path in ('/sarees/linen', '/fabric/linen-stripe') and rules -> 'fibres' = '["linen"]';
update public.collections
  set rules = jsonb_set(rules, '{fibres}', '["cotton_silk", "kota"]')
  where path in ('/sarees/cotton-silk', '/fabric/cotton-silk') and rules -> 'fibres' = '["cotton_silk"]';
