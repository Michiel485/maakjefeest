-- Prijsladder: elk event heeft een pakket (plan).
--   save_the_date  = Save the Date-kaart (EUR 15)
--   uitnodiging    = kaarten + RSVP-pagina + RSVP-dashboard (EUR 25)
--   compleet       = volledige trouwwebsite (EUR 49,99)
-- Bestaande events krijgen 'compleet', zodat niemand functies verliest.
-- Run this in the Supabase SQL editor.

alter table events
  add column if not exists plan text not null default 'compleet';

alter table events
  drop constraint if exists events_plan_check;

alter table events
  add constraint events_plan_check
  check (plan in ('save_the_date', 'uitnodiging', 'compleet'));
