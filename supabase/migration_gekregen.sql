-- Welke kaart heeft een gast gekregen?
--
-- Uit het klantreisgesprek van 21 september 2026. Je kunt van één soort kaart
-- meerdere varianten maken: voor daggasten, voor avondgasten, in een andere
-- taal. Dan wil je in je gastenlijst zien wie welke kreeg.
--
-- Antwoordt een gast via een kaartlink, dan weten we het al uit bron_token.
-- Zet het bruidspaar zelf een groep op "verstuurd", dan kiest het welke kaart
-- het stuurde, en dat komt hier terecht.
--
-- Puur toevoegend, dus veilig te draaien terwijl de site loopt. De code werkt
-- ook zonder deze kolommen: dan onthoudt hij de kaart alleen niet.

alter table rsvp
  -- De Save the Date die deze gast kreeg
  add column if not exists std_kaart_id uuid references cards (id) on delete set null,
  -- De trouwkaart die deze gast kreeg
  add column if not exists inv_kaart_id uuid references cards (id) on delete set null;

-- Controle: twee regels.
--
--   select column_name, data_type
--   from information_schema.columns
--   where table_name = 'rsvp' and column_name in ('std_kaart_id', 'inv_kaart_id');
