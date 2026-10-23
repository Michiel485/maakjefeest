-- Verlopen sites opruimen (besluit Michiel, 23 oktober 2026).
--
-- Twee weken na de einddatum haalt de dagelijkse taak de site, de kaarten,
-- de gastenlijst en de foto's weg. De rij in events blijft staan, met
-- opgeruimd_at erop, zodat het dashboard kan zeggen dat het opgeruimd is en
-- verlengen daarna niet meer kan. Facturen blijven altijd (boekhouding).
--
-- Draai dit één keer in de Supabase SQL editor.
alter table public.events
  add column if not exists opgeruimd_at timestamptz;
