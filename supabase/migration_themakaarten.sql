-- Vier themakaarten: titel (Grote titel), palm, ibiza en fotoschrift (Foto
-- met handschrift). Zie docs/PLAN-kaartontwerpen.md. Puur uitbreidend: alle
-- oude waarden blijven toegestaan. Oudere code toont deze kaarten als Strak.
-- Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto', 'minimaal', 'fotovol', 'boog', 'deco', 'datum', 'eigen', 'titel', 'palm', 'ibiza', 'fotoschrift'));
