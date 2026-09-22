-- Het adres van een gast, voor een papieren trouwkaart.
--
-- Michiels toevoeging van 22 september 2026. Wie straks papieren trouwkaarten
-- wil sturen maar niet alle adressen heeft, zet op de Save the Date de
-- aanmeldstand "Aanwezig ja/nee, met adres" aan. De gast vult dan zijn adres
-- in en het staat in de gastenlijst. Dat scheelt een avond appen.
--
-- Eén tekstveld, geen losse kolommen voor straat, postcode en plaats: het
-- bruidspaar wil er een envelop mee kunnen adresseren, meer niet.
--
-- Puur toevoegend. De code werkt ook zonder deze kolom: dan slaat hij het
-- adres over en zegt dat in het log.

alter table rsvp
  add column if not exists adres text;

-- Controle: één regel.
--
--   select column_name, data_type
--   from information_schema.columns
--   where table_name = 'rsvp' and column_name = 'adres';
