# Plan: alles kloppend, strak en betrouwbaar

Opgesteld 20 september 2026, op verzoek van Michiel. Doel: van "het werkt" naar
"het klopt, het ziet er strak uit en je kunt erop bouwen". Plus drie concrete
wensen: schakelen tussen de bouwers, een website die de stijl van de kaart
overneemt, en taalkeuze.

Dit is een plan, nog geen besluit. Per onderdeel staat wat het is, waarom het
nodig is, hoe groot het is en wat ik van Michiel nodig heb.

---

## 1. Waar we nu staan

Wat er staat en werkt: drie pakketten op één product, de kaartbouwer met drie
ontwerpen en de envelopanimatie, RSVP, de fotomuur, betalen via Mollie,
facturen, de conceptherinneringen per pakket, en een anonieme bezoekersteller.

Wat er nog niet is:

- **Niemand heeft de hele klantreis ooit als klant doorlopen.** Losse stukken
  zijn getest, de keten niet. Dat is het grootste risico: de eerste echte
  klant is nu de tester.
- **De vormgeving is per pagina gegroeid.** Homepage, `/start`, de bouwers, het
  dashboard en de mails hebben allemaal hun eigen kleuren, knoppen en afstanden
  in de code staan. Dat ziet er niet onrustig uit omdat het per pagina klopt,
  maar er is geen enkele plek waar "zo ziet een knop eruit" staat. Elke
  wijziging is daarom handwerk op vijf plekken.
- **Schakelen tussen de bouwers kan niet.** Wie in de Save the Date-bouwer zit
  komt daar niet bij de trouwkaart of de website zonder opnieuw te beginnen.
- **Taal bestaat half.** Op een klantsite staat een schakelaar met zes talen,
  maar die werkt op Google Translate plus negen handmatig vertaalde
  menu-labels. Onze eigen site, de bouwer en de kaart zijn alleen Nederlands.
- **Eén storing bij Supabase haalt alle klantsites offline.** `/events/[slug]`
  staat op `force-dynamic`, dus elke bezoeker haalt live uit de database. Op
  10 september lag Supabase er een middag uit; toen was er nog geen klant.

---

## 2. Kloppend maken

Dit eerst, want vormgeving op een wankele basis is verspilde moeite.

### 2.1 De hele klantreis één keer echt doorlopen

Per pakket van begin tot eind, met echt geld en een echte betaling:

1. Ontwerpen zonder account, envelopsimulatie bekijken, voorbeeld downloaden.
2. Bewaren, inloglink, terugkomen en verdergaan waar je was.
3. Activeren en betalen, factuur ontvangen, kaartlink werkt en het watermerk is weg.
4. Kaart delen, als gast openen, RSVP invullen (bij de twee grotere pakketten).
5. Upgraden naar het volgende pakket, alleen het verschil betalen, alles blijft staan.
6. Bij Compleet: site publiceren, fotomuur, verlengen.

**Waarom:** dit is de enige manier om te weten of het klopt. Elk stuk is los
getest, maar de overgangen zijn waar het misgaat (dat bleek al bij de
welkomstmail en de conceptherinnering).

**Wat ik nodig heb:** één betaling per pakket met een echte creditcard of iDEAL,
of een kortingscode van 100 procent als die er is. Michiel doet de aankoop, ik
loop mee en leg vast wat er niet klopt.

### 2.2 Betrouwbaarheid van de klantsites

- **Caching op `/events/[slug]`**: nu `force-dynamic`. Voorstel: ISR met een
  korte revalidate (60 seconden, zoals de layout al heeft) plus een
  `revalidatePath` bij elke publicatie of wijziging. Dan blijft een klantsite
  online als de database er even uit ligt, en wordt hij sneller.
- **Hetzelfde voor `/kaart/[token]`**, met dezelfde afweging. Let op: de
  kijkteller moet dan apart geteld worden, niet in de pagina-render.
- **Wat er gebeurt als Mollie een webhook twee keer stuurt** is al afgedekt via
  `invoices.mollie_payment_id`. Dat is goed; wel een keer bewust natesten.

### 2.3 Foutmeldingen die een klant begrijpt

Nu zijn het vooral technische meldingen ("Opslaan mislukt"). Voorstel: per
handeling één begrijpelijke regel plus wat de klant kan doen, en de technische
reden alleen in de log.

---

## 3. Vormgeving: strak en betrouwbaar

Het probleem is niet dat het lelijk is, maar dat het nergens is vastgelegd.
Daardoor loopt het langzaam uit elkaar, precies zoals de mailteksten dat deden.

### 3.1 Eén bron voor de vormgeving

Een bestand `lib/ontwerp.ts` (of Tailwind-tokens) met de kleuren, de
typografie, de afstanden, de hoekafrondingen en de schaduwen. Daarnaast een
handvol componenten die overal gebruikt worden: knop (primair, secundair,
rustig), kaart/paneel, invoerveld, label, melding, en de sectiekop met het
gouden lijntje.

**Waarom:** nu staat `#C5A059` op tientallen plekken los in de code. Eén
kleurwijziging is dan een zoek-en-vervangactie met kans op vergeten plekken.
En het verklaart waarom de hoeken van de kaart niet lazen: die schaduw stond
maar op één plek goed.

**Hoe groot:** het maken is een halve dag. Het overzetten van alle pagina's is
meer werk, dus dat doen we per pagina, beginnend bij wat een klant het eerst
ziet: homepage, `/start`, de bouwers, het dashboard.

### 3.2 De mails in dezelfde stijl

De mails hebben nu elk hun eigen HTML met eigen kleuren. Voorstel: één
basissjabloon (header, body, knop, voetregel) waar elke mail zijn inhoud in
zet. Dat is dezelfde beweging als bij de teksten: één plek.

### 3.3 Mobiel nalopen

Alles is op een breed scherm gebouwd. De kaartbouwer met zijn zijbalk en de
grote kaart ernaast is op een telefoon het spannendst, en juist daar opent een
gast zijn kaart. Nalopen op 375 pixels breed.

---

## 4. Schakelen tussen de bouwers

De wens: vanuit de Save the Date-bouwer naar de trouwkaart en naar de website
kunnen, zonder opnieuw te beginnen.

### 4.1 Wat er in de weg zit

Het pakket wordt nu vastgelegd op het moment dat je iets bewaart: de bouwer
leidt het pakket af uit het kaarttype (`CARD_TYPE_PLAN`) en schrijft dat op het
event. Wie dus een Save the Date bewaart, heeft een event met pakket
`save_the_date`, en dat pakket bepaalt vervolgens wat hij mag.

Dat is de verkeerde kant op. **Het pakket hoort te volgen uit wat iemand
activeert, niet uit waar hij begonnen is.** Ontwerpen is gratis; pas bij
versturen of publiceren komt er geld bij kijken. Dus:

- Ontwerpen mag alles: een Save the Date, een trouwkaart en een website op
  hetzelfde event, ook zonder te betalen.
- Bij activeren kiest de klant wat hij afneemt, en dat bepaalt het pakket.
- Wat niet in het gekozen pakket zit, blijft staan maar is niet te versturen.
  Dat is meteen het beste verkoopargument: het staat er al, je ziet het,
  activeren is één knop.

### 4.2 Wat er dan moet gebeuren

1. Het pakket loskoppelen van het opslaan. Een event krijgt bij bewaren geen
   pakket meer, of een neutrale beginwaarde, en de pakketpoorten gaan alleen
   over wat je kunt versturen en publiceren.
2. In de kaartbouwer een schakelaar bovenin: Save the Date, trouwkaart,
   website. Met een duidelijk verschil tussen "klaar om te versturen" en
   "ontwerp, nog niet actief".
3. De dashboardweergave daarop aanpassen: één event met meerdere onderdelen,
   elk met zijn eigen status.

**Let op, dit raakt de pakketpoorten en dus de kassa.** Dit is het enige
onderdeel van dit plan waar we iets kunnen breken dat met geld te maken heeft.
Daarom hoort het pas na 2.1 (de klantreis testen), zodat we weten wat werkte
voordat we eraan sleutelen.

### 4.3 De website in de stijl van de kaart

Gedeeltelijk werkt dit al: het thema (`style`, een van de vijf) staat op het
event en wordt door kaart en site gebruikt. Wat nog niet meekomt:

- Het **kaartontwerp** (strak, sierlijk, bohemian) heeft geen tegenhanger in de
  site. De site heeft een eigen `frame_style` en losse fontkeuzes.
- Voorstel: per kaartontwerp een bijpassend recept voor de site (lettertypes,
  randstijl, hoekafronding), in dezelfde tabel waar `CARD_DESIGN_STYLE` staat.
  Dan volgt de site automatisch de kaart, en kan de klant er daarna van
  afwijken.
- Namen, datum en locatie komen al mee.

---

## 5. Taal

Hier zitten vier verschillende dingen achter elkaar, en ze vragen elk een
andere oplossing. Dat is belangrijk, want ze worden vaak op één hoop gegooid.

### 5.1 Onze eigen teksten (marketing en bouwer)

Dat zijn teksten die wij schrijven en die dus echt vertaald kunnen worden.

**Mechanisme, in gewone taal.** Je hebt twee keuzes voor waar de taal
"vastzit":

- **In de URL**, dus `sayingyes.nl/en/...` naast `sayingyes.nl/...`. Elke taal
  is dan een eigen pagina die Google los kan indexeren, die je kunt delen en
  waar je met `hreflang` aan Google vertelt dat het dezelfde pagina in een
  andere taal is.
- **In een cookie of localStorage**, dus dezelfde URL die er anders uitziet
  afhankelijk van je keuze. Simpeler te bouwen, maar Google ziet dan maar één
  versie en die is Nederlands.

**Mijn advies: de URL.** Niet omdat het netter is, maar om jouw eigen
zoekwoordonderzoek: "wedding website" is in Nederland de grootste term en die
komt van expats rond Amsterdam. Met een cookie-oplossing kun je daar nooit op
ranken, met `/en/` wel. Dat is precies de reden waarom een Engelse
landingspagina al op de lijst "later" van het prijsladderplan staat.

De taalkeuze komt in de header, rechts, met NL als standaard. **Geen
automatische omschakeling op basis van de browsertaal**, zoals je zei: mensen
komen op Nederlands en kiezen zelf. Dat is ook beter voor Google, want een
automatische omleiding verstoort het indexeren.

**Aanpak in stappen**, want alles nu vertalen is zonde van de tijd:

1. Het mechanisme neerzetten: de `/en/` route, de schakelaar, het onthouden van
   de keuze, `hreflang`, en de sitemap die beide talen kent.
2. Alleen de bouwer vertalen (dat is jouw wens voor de expats) plus één Engelse
   landingspagina.
3. De rest van de marketing pas als er Engels verkeer blijkt te komen. Dat kun
   je meten in de bezoekersteller.

### 5.2 De bouwer in het Engels

Dat is gewoon onderdeel 5.1 toegepast op de bouwerteksten. Wel een
aandachtspunt: de bouwer staat vol met voorbeeldteksten en uitleg, dus dit is
qua woorden het grootste stuk. Een paar honderd korte teksten.

### 5.3 De taal van de kaart: Engels, Frans en Duits

Dit is iets anders dan de bouwertaal: een Nederlands bruidspaar kan een Engelse
kaart willen voor buitenlandse gasten. Het gaat om de vaste teksten op de
kaart, en die zijn te overzien:

- de kop ("Save the Date", "Wij gaan trouwen")
- de standaardboodschap
- de uitnodigingsregel per gastengroep (dag, avond, receptie)
- de knoppen onder de kaart ("Laat weten of je erbij bent")
- de datumopmaak (19 september 2026 wordt September 19, 2026)

**Waar het opgeslagen wordt:** `content.taal` op de kaart, dus geen migratie.
Dan staat het naast de andere kaartinstellingen en gaat het automatisch mee in
de downloadafbeelding, want die leest dezelfde gegevens.

**Let op twee dingen:**

1. De afbeelding wordt met satori gemaakt en die haalt per kaart alleen de
   letters op die erin voorkomen. Voor Duitse en Franse tekens (ä, ç, é) moet
   dat opgevraagde tekenbereik dus kloppen, anders vallen die letters weg. Dat
   is dezelfde valkuil als bij de ampersand.
2. De datumopmaak moet per taal, niet alleen de woorden.

### 5.4 De teksten van het bruidspaar

Wat het bruidspaar zelf typt (hun verhaal, het programma, de cadeautips) kunnen
wij niet vertalen. Nu krijgt een gast daarvoor de Google Translate-schakelaar
met zes talen. Dat is een prima noodoplossing voor gastenpagina's en zou ik
laten staan. Wel eerlijk zijn in de bouwer over wat het is, zodat een
bruidspaar niet denkt dat wij het vertalen.

Eventueel later: per tekstveld een tweede taalvakje, zodat een tweetalig paar
zijn eigen Engelse versie kan invullen. Dat is pas zinnig als er vraag naar is.

---

## 6. Voorgestelde volgorde

1. **De klantreis per pakket doorlopen** en repareren wat niet klopt (2.1).
2. **Caching op de klantsites** (2.2), want dat is klein en haalt het grootste
   betrouwbaarheidsrisico weg.
3. **Eén bron voor de vormgeving** plus de basiscomponenten, en daarna de
   pagina's één voor één omzetten (3.1, 3.2).
4. **Het pakket loskoppelen van het opslaan** en de schakelaar tussen de
   bouwers (4.1, 4.2), met de sitestijl die de kaart volgt (4.3).
5. **Taalmechanisme** neerzetten, bouwer in het Engels, Engelse landingspagina
   (5.1, 5.2).
6. **Kaarttaal** Engels, Frans en Duits (5.3).

Onderdeel 4 is het enige dat aan de kassa raakt, dus dat wil ik na de test van
de klantreis doen en niet ervoor.

---

## 7. Wat ik van Michiel nodig heb

- **Een besluit over de taal in de URL** (`/en/`) of in een cookie. Mijn advies
  is de URL, om op "wedding website" te kunnen ranken.
- **Een betaling per pakket** voor de test van de klantreis, of een
  kortingscode van 100 procent.
- **Een keuze over de volgorde**: eerst alles kloppend maken, of eerst de
  vormgeving. Mijn advies is kloppend eerst.
- **Wel of geen tweede taalvakje per tekstveld** voor het bruidspaar (5.4). Mijn
  advies: niet nu.
