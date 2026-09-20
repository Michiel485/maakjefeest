-- De gastenlijst.
--
-- De tabel rsvp wordt de gastenlijst. Dat is bewust geen nieuwe tabel: een
-- gast en een aanmelding zijn hetzelfde ding in twee standen. Iemand staat op
-- de lijst (status uitgenodigd), reageert voorlopig op de Save the Date
-- (status voorlopig), en vult later de hele RSVP in bij de uitnodiging of de
-- website (status definitief). Twee tabellen zouden betekenen dat we die twee
-- moeten koppelen en synchroon houden, en dat is precies het soort dubbele
-- waarheid dat we net hebben opgeruimd bij de kaartteksten.
--
-- Puur toevoegend, dus veilig te draaien terwijl de site loopt. De bestaande
-- kolommen blijven werken; de code die er nu staat merkt hier niets van.
--
-- De tabel heet nog rsvp. Omdopen naar guests zou netter lezen, maar dat kan
-- alleen samen met een nieuwe versie van de code en levert een moment op
-- waarop het een of het ander stuk is. Niet nu dus.

alter table rsvp
  -- Voor- en achternaam apart. Michiels oplossing voor het probleem dat twee
  -- gasten allebei "Sanne" heten: met een achternaam erbij is een dubbele
  -- inzending bijna altijd te herkennen. De oude kolom name blijft gevuld met
  -- de twee aan elkaar, zodat alles wat er nu is blijft werken.
  add column if not exists voornaam text,
  add column if not exists achternaam text,

  -- Optioneel. Gevoeliger dan een mailadres, dus nooit verplicht.
  add column if not exists telefoon text,

  -- Het huishouden. Losse regels per persoon met een gedeeld kenmerk, zodat je
  -- per persoon een dieetwens kunt bijhouden en mensen achteraf kunt
  -- groeperen. De naam is alleen voor de groet op de kaart.
  add column if not exists huishouden_id uuid,
  add column if not exists huishouden_naam text,

  -- Kinderen tellen anders bij de catering. De leeftijd vragen we alleen van
  -- kinderen; een volwassene naar zijn leeftijd vragen op een trouwkaart is
  -- raar.
  add column if not exists is_kind boolean not null default false,
  add column if not exists leeftijd smallint,

  -- uitgenodigd  = staat op de lijst, heeft nog nooit gereageerd
  -- voorlopig    = ja of nee gegeven op een Save the Date, zachte reservering
  -- definitief   = de volledige RSVP ingevuld
  -- De standaard is definitief, want alles wat er tot nu toe in stond kwam uit
  -- het volledige formulier op de website.
  add column if not exists status text not null default 'definitief',

  -- Op welke kaartlink dit binnenkwam. Daarmee weten we meteen de gastengroep
  -- en de taal, en zien we of een link is doorgestuurd naar meer mensen dan
  -- hij voor bedoeld was.
  add column if not exists bron_token text,

  -- Onzichtbaar kenmerk uit de browser van de gast. Vult dezelfde persoon later
  -- opnieuw in op hetzelfde toestel, dan werken we zijn eigen antwoord bij in
  -- plaats van er een tweede naast te zetten.
  add column if not exists apparaat text,

  -- Een allergie is veiligheid, vegetarisch is een voorkeur. Voor een cateraar
  -- zijn dat twee verschillende dingen, dus twee velden. De bestaande kolom
  -- dietary blijft de voorkeur.
  add column if not exists allergie text,

  -- Antwoorden op de vragen die het bruidspaar zelf samenstelt. JSON, zodat er
  -- geen migratie nodig is zodra iemand een vraag toevoegt.
  add column if not exists antwoorden jsonb;

-- Zoeken op "heeft dit toestel al geantwoord voor deze bruiloft" gebeurt bij
-- elke inzending, dus daar hoort een index op.
create index if not exists rsvp_event_apparaat_idx
  on rsvp (event_id, apparaat)
  where apparaat is not null;

-- En de lijst zelf wordt gefilterd op stand: wie moet ik nog najagen.
create index if not exists rsvp_event_status_idx
  on rsvp (event_id, status);
