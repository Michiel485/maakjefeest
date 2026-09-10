-- Drie ontwerprichtingen voor de kaarten: strak, sierlijk en bohemian.
-- Puur uitbreidend: de oude waarde 'foto' blijft toegestaan (die telt in de
-- code als 'klassiek'), dus bestaande kaarten en oudere code blijven werken.
-- Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto'));
