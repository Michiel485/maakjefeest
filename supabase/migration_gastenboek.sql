-- Gastenboek op de trouwsite (ontwerpronde, ronde 5, 2 oktober 2026).
-- De berichtjes die gasten bij het aanmelden schrijven kunnen, na een vinkje
-- van het bruidspaar in de gastenlijst, als gastenboek op de site. Standaard
-- staat alles uit: niets komt op de site zonder dat het bruidspaar het koos.
alter table public.rsvp
  add column if not exists bericht_openbaar boolean not null default false;
