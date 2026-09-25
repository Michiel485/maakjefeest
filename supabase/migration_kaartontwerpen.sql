-- Vijf nieuwe kaartontwerpen: minimaal, fotovol, boog, deco en datum.
-- Zie docs/PLAN-kaartontwerpen.md. Puur uitbreidend: alle oude waarden
-- blijven toegestaan, dus bestaande kaarten en oudere code blijven werken.
-- Oudere code kent de nieuwe waarden niet en toont die kaarten als Strak.
-- Run this in the Supabase SQL editor.

alter table cards
  drop constraint if exists cards_template_check;

alter table cards
  add constraint cards_template_check
  check (template in ('klassiek', 'sierlijk', 'bohemian', 'foto', 'minimaal', 'fotovol', 'boog', 'deco', 'datum', 'eigen'));
