-- Een nieuw ontwerp: Krans, een getekende krans van eucalyptus en besjes
-- (10 oktober 2026). Bevat ook alle eerdere ontwerpen. Puur uitbreidend.
-- Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto', 'minimaal', 'fotovol', 'boog', 'deco', 'datum', 'eigen', 'titel', 'palm', 'ibiza', 'fotoschrift', 'olijf', 'pampas', 'pampasruit', 'terra', 'terraruit', 'herfst', 'herfstruit', 'goudblad', 'magnolia', 'winter', 'lente', 'zomer', 'liefde', 'strand', 'boho', 'festival', 'hartlijn', 'tweeharten', 'hartamp', 'hartkader', 'krijthart', 'kalligrafie', 'schaduwhart', 'krijtgroot', 'hartrand', 'harthoek', 'pakjurk', 'proost', 'strik', 'krans'));
