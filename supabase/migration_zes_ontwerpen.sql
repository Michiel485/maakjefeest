-- Zes nieuwe ontwerpen (27 september 2026): groot krijthart, hart op de
-- rand, hart in de hoek, pak en jurk, proost en strik. Bevat ook alle eerdere
-- ontwerpen, dus dit is genoeg als migration_handharten.sql nog niet gedraaid
-- is. Puur uitbreidend. Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto', 'minimaal', 'fotovol', 'boog', 'deco', 'datum', 'eigen', 'titel', 'palm', 'ibiza', 'fotoschrift', 'olijf', 'pampas', 'pampasruit', 'terra', 'terraruit', 'herfst', 'herfstruit', 'goudblad', 'magnolia', 'winter', 'lente', 'zomer', 'liefde', 'strand', 'boho', 'festival', 'hartlijn', 'tweeharten', 'hartamp', 'hartkader', 'krijthart', 'kalligrafie', 'schaduwhart', 'krijtgroot', 'hartrand', 'harthoek', 'pakjurk', 'proost', 'strik'));
