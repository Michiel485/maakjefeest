-- De kaders uit de websitebouwer als kaartontwerpen: zes kransen en twee
-- liggende kaarten. Puur uitbreidend. Oudere code toont ze als Strak.
-- Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto', 'minimaal', 'fotovol', 'boog', 'deco', 'datum', 'eigen', 'titel', 'palm', 'ibiza', 'fotoschrift', 'olijf', 'pampas', 'pampasruit', 'terra', 'terraruit', 'herfst', 'herfstruit', 'goudblad', 'magnolia'));
