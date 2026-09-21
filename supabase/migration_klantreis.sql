-- De klantreis in de database.
--
-- Uit het gesprek van 21 september 2026. Eén bruiloft met onderdelen eronder,
-- in plaats van een losse rij per concept. De fasen zelf rekenen we uit en
-- slaan we niet op: die volgen uit de trouwdatum en uit wat er verstuurd is,
-- en een fase in een kolom zou binnen een dag achterlopen.
--
-- Vijf toevoegingen, allemaal puur toevoegend. Bestaande rijen houden overal
-- leeg of de standaard, dus dit is veilig te draaien terwijl de site loopt en
-- er verandert niets aan wat er nu staat.

-- ── 1. Ontwerpen binnen één bruiloft ────────────────────────────────────────
-- Dit was de oorzaak van de losse kolommen in het dashboard: elk concept werd
-- een eigen bruiloft. Wijst hoort_bij naar een andere bruiloft, dan is deze rij
-- een ontwerp binnen die bruiloft. Leeg betekent: dit is zelf een bruiloft.
--
-- Met set null bij verwijderen, zodat een ontwerp niet stil verdwijnt als de
-- hoofdbruiloft weggaat. Dezelfde keuze als bij invoices.event_id.
alter table events
  add column if not exists hoort_bij uuid references events (id) on delete set null;

create index if not exists events_hoort_bij_idx on events (hoort_bij);

-- ── 2. De deadline van de locatie ───────────────────────────────────────────
-- Komt uit Michiels eigen bruiloft: hij gaf zijn aantallen te laat door, de
-- locatie had de inkoop al gedaan, en hij betaalde voor gasten die niet kwamen.
--
-- Wij sturen nooit iets naar de locatie. We herinneren alleen, en zodra de
-- klant zegt dat het gelukt is, zwijgen we voor altijd.
--
-- Vorm: { "naam": "Kasteel Wijenburg", "datum": "2027-06-05",
--         "gedaan": false, "gemaild": { "tien": null, "dag": null, "navraag": null } }
alter table events
  add column if not exists deadline jsonb;

-- ── 3. De checklist ─────────────────────────────────────────────────────────
-- Michiels voorstel in plaats van het kladblok, en hij moet vanaf het begin
-- zichtbaar zijn: de Save the Date is er zelf een punt van. Onze eigen punten
-- staan in de code, hier bewaren we alleen wat de klant heeft afgevinkt en wat
-- hij zelf heeft toegevoegd.
--
-- Vorm: { "af": ["gastenlijst", "save-the-date"],
--         "eigen": [{ "id": "…", "wat": "Ringen ophalen", "af": false }] }
alter table events
  add column if not exists checklist jsonb;

-- ── 4. Hoe vaak wil de klant een stand horen ────────────────────────────────
-- Michiels punt: dat moeten we vragen en niet voor hem beslissen. Wekelijks is
-- de standaard, want dagelijks is voor de meeste bruiloften te veel en
-- maandelijks te laat als je aan het najagen bent.
alter table events
  add column if not exists stand_frequentie text not null default 'wekelijks';

alter table events
  drop constraint if exists events_stand_frequentie_check;

alter table events
  add constraint events_stand_frequentie_check
  check (stand_frequentie in ('nooit', 'dagelijks', 'wekelijks', 'maandelijks'));

-- Wanneer de laatste standmail eruit ging, zodat er nooit twee op één dag
-- kunnen. Dezelfde bescherming die de andere cronmails ook hebben.
alter table events
  add column if not exists stand_gemaild_at timestamptz;

-- ── Controle ────────────────────────────────────────────────────────────────
-- Na het draaien zou dit vijf regels moeten geven, en bij stand_frequentie
-- moet de standaard 'wekelijks' staan.
--
--   select column_name, data_type, column_default
--   from information_schema.columns
--   where table_name = 'events'
--     and column_name in ('hoort_bij', 'deadline', 'checklist',
--                         'stand_frequentie', 'stand_gemaild_at')
--   order by column_name;
