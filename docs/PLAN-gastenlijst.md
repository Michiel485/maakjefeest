# Plan: aanmelden in de kaart, en de gastenlijst

Stand 20 september 2026. Dit is de basis om samen over te sparren, nog niet
gebouwd. Het gaat over de ideeën B en D uit `docs/AUDIT-en-ideeen.md`, met de
aanvullingen van Michiel erin verwerkt.

---

## 1. Waar het om draait

"Wie komt er nou eigenlijk" is de echte pijn van een bruiloft organiseren. Wat
we vandaag bieden is een kaartlink per gastengroep en een RSVP-formulier op een
aparte pagina. Dat werkt, maar het bruidspaar weet nooit wie er nog niet heeft
gereageerd, want wij weten niet wie er zijn uitgenodigd.

De oplossing is niet één ding maar twee, en ze moeten los van elkaar kunnen
werken.

---

## 2. Twee manieren, en de klant kiest

Dit is het belangrijkste ontwerpbesluit: **een gastenlijst wordt optioneel en
we zeggen er eerlijk bij voor wie welke manier is.**

### Zonder gastenlijst, de makkelijke weg
Je deelt één link per gastengroep. De gast opent de kaart, tikt op ja of nee en
vult zelf zijn naam in. Klaar. Geen voorbereiding, geen lijst bijhouden.

Dit is voor het bruidspaar dat er niet te veel tijd in wil steken, en dat is een
groot deel. Deze weg moet daarom nooit als tweede keus voelen: hij staat
voorop, hij werkt meteen, en hij is wat je nu al kunt.

### Met gastenlijst, voor wie het overzicht wil
Je zet je gasten er van tevoren in, per huishouden. Iedereen krijgt een eigen
link. Dan kan er ineens veel meer:

- de kaart begroet het gezin bij naam
- aanmelden is één tik, want wij weten al wie je bent
- je ziet wie er nog niet gereageerd heeft, en dat is precies wat je wilt weten
- je kunt met één knop alleen die mensen een herinnering sturen
- de kijkteller wordt "wie heeft hem geopend" in plaats van een getal
- je hoeft niet zelf bij te houden wie je welke link hebt gestuurd

Dat laatste rijtje is het verhaal waarmee je dit verkoopt. Niet "een
gastenlijst", maar "je weet wie er nog niet heeft gereageerd".

### Hoe we de keuze presenteren
In de bouwer, op het moment dat je gaat versturen, twee kaarten naast elkaar:

> **Deel één link**
> Je stuurt dezelfde link naar iedereen in een groep. Gasten vullen zelf hun
> naam in. Niets voor te bereiden.

> **Werk met een gastenlijst**
> Je zet je gasten er eenmalig in. Iedereen krijgt zijn eigen link, jij ziet
> wie er nog niet heeft gereageerd en kunt ze met één knop herinneren.

Wisselen kan later nog: wie met één link begint en halverwege een lijst wil,
houdt alle aanmeldingen die al binnen zijn.

---

## 3. Aanmelden in de kaart zelf

Nu verlaat de gast de envelop en komt op een webpagina. Elke stap kost
antwoorden. Beter: de vraag staat onder de kaart, waar hij al is.

**Michiels bezwaar, en het antwoord.** Als de kaart alleen ja of nee vraagt,
denkt de gast dat hij klaar is en komen de dieetwensen nooit. Dat klopt. Dus:
ja en nee staan onder de kaart, en **wie op ja tikt krijgt de rest direct op
diezelfde plek**, zonder paginawissel. Naam, met hoeveel personen, dieetwensen,
wat je verder ook wilt vragen. Wie op nee tikt is echt klaar.

Dat is beter dan doorsturen naar een aparte pagina, want de drempel zit in het
wisselen van pagina en niet in het aantal vragen. Iemand die net ja heeft
getikt is op zijn meest bereidwillige moment; dán vraag je door.

**En het moet uit kunnen.** Michiels tweede punt: je stuurt soms een Save the
Date terwijl je nog niet weet wie daggast wordt en wie avondgast. Dan wil je
helemaal niets vragen, of alleen ja en nee zonder de rest.

Dus per kaart een keuze met drie standen:

| Stand | Wat de gast ziet | Wanneer |
|---|---|---|
| Niets vragen | alleen de kaart | Save the Date, je weet nog niets |
| Alleen ja of nee | twee knoppen, klaar | je wilt alvast een indicatie |
| Volledig aanmelden | ja of nee, daarna de vragen | de echte uitnodiging |

Standaard: niets vragen bij een Save the Date, volledig bij een trouwkaart. Dat
is in beide gevallen wat je meestal wilt, en het staat in één klik anders.

---

## 4. Een link per huishouden, niet per persoon

Michiels aanvulling en hij heeft gelijk: je nodigt een gezin uit, geen losse
mensen. Dus de eenheid is het huishouden.

Een regel in de gastenlijst is dan: een naam voor de groet ("Familie De
Vries", of "Sanne en Tom"), de losse namen van wie erbij horen, een gastengroep
en eventueel een mailadres of telefoonnummer.

Op de kaart komen alle namen van dat huishouden te staan, en bij het aanmelden
staat iedereen apart met een vinkje. Zo kan Sanne wel en Tom niet, en kan de
dochter van acht een eigen dieetwens hebben. Precies zoals een papieren
antwoordkaartje werkt.

---

## 5. Importeren uit Excel

Voor grote lijsten is met de hand invoeren geen optie. Dus: een bestand
uploaden, wij lezen het, en je ziet eerst wat wij ervan begrepen hebben
voordat er iets wordt opgeslagen.

Wat ik zou doen:

- **Een sjabloon om te downloaden**, met de kolommen er al in en één ingevulde
  voorbeeldregel. Dat scheelt het meeste gedoe.
- **Ook gewoon plakken.** Veel mensen hebben hun lijst al ergens staan. Een
  groot tekstvak waar je een stuk uit Excel in plakt werkt vaak sneller dan
  uploaden, en we kunnen de kolommen zelf herkennen.
- **Eerst tonen wat we begrepen hebben**, met een rij per huishouden en de
  regels die we niet snappen apart erboven. Pas daarna opslaan.
- **Tweede keer importeren mag niet verdubbelen.** Herkennen op naam plus
  mailadres, en bestaande regels bijwerken in plaats van er nieuwe naast te
  zetten.
- Xlsx lezen kan met het pakket dat we al hebben (`xlsx`, nu gebruikt voor de
  export), dus daar komt niets bij.

---

## 6. Dit zijn persoonsgegevens, en dat verandert de eisen

Michiel wijst hier terecht op. Vandaag staan in de database vooral gegevens van
mensen die zichzelf hebben aangemeld. Met een gastenlijst zet het bruidspaar
gegevens van anderen in ons systeem, zonder dat die daar iets van weten. Dat is
een zwaardere verantwoordelijkheid.

Wat daar minimaal bij hoort:

- **Een link per huishouden moet onraadbaar zijn.** Niet af te leiden uit de
  kaartlink en niet op te hogen. Hetzelfde soort token als nu, maar per
  huishouden.
- **Geen namen in de voorvertoning.** Een link die je in WhatsApp plakt mag
  niet "Familie De Vries" laten zien in het voorbeeldblokje.
- **Zoeken op een naam mag niets opleveren** voor wie de link niet heeft. Dus
  geen zoekfunctie op de publieke kant, en geen foutmelding die verklapt dat
  een huishouden bestaat.
- **Een rem op raden**, zoals nu al op de kortingscodes en het wachtwoord zit.
- **Weggooien moet echt weggooien.** Een gastenlijst hoort mee te verdwijnen
  met de bruiloft, via `lib/opruimen.ts`, net als de aanmeldingen nu.
- **Een bewaartermijn.** Een gastenlijst van een bruiloft van twee jaar geleden
  heeft niemand nodig. Aansluiten bij de termijnen die er al zijn.
- **Exporteren en verwijderen moet kunnen**, zodat het bruidspaar aan een gast
  die erom vraagt kan laten zien wat er staat.
- **En het moet uitgelegd worden.** Eén zin in de bouwer op het moment dat je
  de lijst aanmaakt, en een stukje in de privacyverklaring. Dat is geen
  formaliteit: het bruidspaar is hier zelf verantwoordelijke en hoort te weten
  wat het doet.

Wat ik expres níét zou doen: telefoonnummers verplicht maken, of de kaart
automatisch via WhatsApp laten versturen vanuit ons. Dat maakt van een
gastenlijst een verzendlijst, en dan komen er heel andere regels bij kijken.

---

## 7. In welke volgorde

1. **Aanmelden onder de kaart**, met de drie standen uit deel 3. Werkt ook
   zonder gastenlijst en is op zichzelf al waardevol.
2. **De gastenlijst met een link per huishouden**, handmatig invoeren.
3. **Wie heeft nog niet gereageerd, en de herinneringsknop.** Dit is waar het
   allemaal om begonnen was.
4. **Importeren uit Excel of plakken.** Pas zinvol als de rest staat.

Stap 1 kan los. Stap 2 en 3 horen bij elkaar, want een gastenlijst zonder het
overzicht is alleen maar werk.

---

## 8. Waar we het nog over moeten hebben

- Hoort de gastenlijst bij een bestaand pakket of is het een reden voor een
  vierde, duurdere trede? Mijn gevoel: bij Uitnodiging & RSVP, want het maakt
  dat pakket pas echt af, en een vierde trede maakt de prijslijst ingewikkeld.
- Wat vragen we standaard bij het aanmelden? Nu staan er dieetwensen, een
  liedje, overnachten en twee eigen vragen. Mag het bruidspaar die zelf
  samenstellen of houden we het vast?
- Moet een gast zijn antwoord later nog kunnen wijzigen? Met een eigen link kan
  dat makkelijk, en het scheelt jou mailtjes van gasten die zich bedenken.
