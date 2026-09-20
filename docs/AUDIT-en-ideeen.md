# Audit en ideeën, 20 september 2026

Geschreven terwijl Michiel weg was, op zijn verzoek: zoveel mogelijk testen,
kijken waar het slimmer kan, data besparen, oude code eruit, en daarna
nadenken over wat SayingYes waardevoller maakt.

Wat al gebouwd en gepusht is staat in deel 2. Wat ik vond maar liet liggen
staat in deel 3, met een advies. Deel 4 zijn de ideeën.

---

## 1. Wat er getest is

Alles tegen de echte database, met testdata die daarna is opgeruimd. Er staan
nu nog precies drie concepten, die van Michiel zelf.

**Alle pagina's.** Twintig routes afgetikt: allemaal een nette status, geen
enkele serverfout in de log. `/dashboard` stuurt terecht door naar inloggen.

**Alle POST-endpoints met een lege body.** Acht stuks, geen enkele 500.
Auth-endpoints geven 401, verkeerde invoer 400, verkeerde methode 405, en de
twee tellers geven 204 (die mogen nooit iets breken voor de bezoeker).

**Zichtbaarheid van kaarten per pakket.** Drie bruiloften met alle pakketten,
elk met een Save the Date en een trouwkaart. Een trouwkaart op een
Save the Date-pakket is dicht, de rest open. Ook de download geeft dan een
watermerk, en de voorvertoning voor WhatsApp geeft niets prijs.

**Cachegedrag.** Publieke kaart en klantsite: eerste bezoek een misser, daarna
een treffer. Met een ongeldige databasesleutel blijft de gecachte kaart 200
geven met de echte namen erin. Een onbekende kaart geeft tijdens die storing
500, dus geen leugen tegen de gast, en bij een gezonde database weer gewoon
404.

**De kijkteller.** Vijf keer een gecachte kaart openen geeft vijf tikken. Een
dichte kaart en Googlebot geven er geen. Een echte browser in de preview telde
ook mee.

**Het opruimen van een bruiloft.** Een concept met twee bestanden in de
opslag, een kaart, een pagina en een aanmelding. De echte cron haalde alles
weg, ook beide bestanden. De bucket is weer leeg op de placeholder na.

**Het RSVP-formulier.** Lege naam, 25 gasten in één keer, een naam van 500
tekens en een normale aanmelding met dieetwens. Zie deel 2.

**De kortingscode-endpoint.** 25 pogingen achter elkaar: de 21e wordt
geweigerd.

**De kaartbouwer in de browser.** Met drie kaarten erin: wisselen zet het
juiste soort kaart, de juiste gastengroep en de bijbehorende uitnodigingszin,
kopiëren laat de vorige kaart staan, en de balk loopt netjes door op
telefoonbreedte.

---

## 2. Gevonden en gerepareerd

### Werk dat stil verdween
De kaartbouwer onthield precies één kaart. Wie er een voor daggasten bewaarde,
daarna de gastengroep op avondgasten zette en weer bewaarde, overschreef de
eerste. Die was niet onvindbaar maar weg. Nu een keuzelijst met alle kaarten
van deze bruiloft, plus kopiëren en nieuwe kaart.

### Twee dingen die het cachen kapot had gemaakt
Het cachen van de klantsites en kaarten (om ze bij een storing in de lucht te
houden) brak twee dingen die ik pas vond door te testen:

De voorbeeldweergave voor het bruidspaar gaf 500. Een gecachte pagina mag geen
cookie lezen. De eigenaarscontrole staat nu in een eigen ongecachte route
`/kaart/[token]/voorbeeld`, en dat is ook de juiste verdeling: honderd gasten
openen dezelfde link, het bruidspaar kijkt één keer.

En de kijkteller telde alleen nog bij een cachemisser, dus honderd gasten
gaven samen één tik. Die zit nu in de browser van de gast.

### Een lek in de download en de voorvertoning
De kaartpagina keek naar het pakket, maar de download en de WhatsApp-
voorvertoning alleen naar de status. Een trouwkaart naast een betaalde
Save the Date was dus zonder watermerk te downloaden. Alle vier de plekken
gebruiken nu dezelfde regel, op één plek in de code.

### Een verwijderactie die rommel achterliet
Het bruidspaar dat zijn site weggooide liet de headerfoto en de kaartfoto's
voor altijd in de opslag staan, en de kaartrijen bleven als wezen in de
database achter met een deel-token dat nergens meer op uitkwam. De cron deed
het wel goed; dat is precies het probleem van twee wegen naar hetzelfde. Nu
één plek, `lib/opruimen.ts`, die beide gebruiken.

### Twee open deuren
De kortingscode-endpoint was een orakel: een script kon er zo snel als het
wilde codes langs halen, en het antwoord vertelde het verschil tussen "bestaat
niet" en "bestaat maar is opgebruikt". Er staat nu één code `TEST` van 95
procent in de database, opgebruikt, dus het was nog niet uit te buiten. Maar
een code als `WELKOM` of `GRATIS` met meerdere gebruiken is binnen seconden te
vinden. Nu twintig pogingen per minuut per IP.

En het RSVP-formulier had geen enkele controle, terwijl dat de enige plek is
waar het publiek in onze database schrijft. Een lege naam kwam er gewoon in en
belandde als naamloze regel in de gastenlijst. Een naam van tien megabyte ook.
Nu: naam verplicht en afgekapt, grenzen op de andere velden, hoogstens twintig
personen per keer en tien inzendingen per minuut per IP.

### Lint was waardeloos
`npm run lint` gaf 8452 meldingen. Oorzaak: twee oude werkmappen van
hulpagenten onder `.claude/worktrees` stonden in de repo (146 MB, twee hele
kopieën) en werden meegelint, 232 bestanden geminificeerde code. Nu uitgesloten
en uit de index. Van 8452 naar 65 meldingen, die wél over onze code gaan.

Een daarvan was meteen een vondst: `Chevron` in de websitebouwer stond binnen
de paginacomponent, dus bij elke render een nieuw componenttype. Dezelfde fout
die in de kaartbouwer eerder de focus uit de invoervelden sloeg.

### Weg
- Het pakket `stripe` stond in de dependencies maar wordt nergens gebruikt. De
  enige treffer was het woord "stripe" in een CSS-commentaar. 17 MB.
- De opruimregel voor `magic_links` in de cron. Die tabel werd alleen nog
  leeggemaakt en nooit meer gevuld; inloggen gaat via Supabase Auth.
- `app/dashboard/PauseButton.tsx` bestond uit één regel, `export {}`, en werd
  nergens gebruikt.

### Klaar om te draaien: tien dode kolommen en een dode tabel
`supabase/migration_opruimen_dode_kolommen.sql`. Geen enkele regel code raakt
ze nog aan, nagekeken met een zoekopdracht over app, lib en components:

| Wat | Waarom weg |
|---|---|
| `story_enabled`, `story_title`, `story_text`, `story_image_url`, `story_image_pos_x`, `story_image_pos_y` | Ons Verhaal is verhuisd naar de tabel `pages` |
| `title_font` | vervangen door de vier `font_`-kolommen |
| `draft_reminder_1/2/3_sent_at` | vervangen door de teller `draft_reminder_stap` |
| tabel `magic_links` | restant van een eigen inlogsysteem, leeg |

Gecontroleerd tegen de echte database: nergens inhoud, geen bestand dat zijn
eigenaar kwijtraakt, en de teller klopt met de oude kolommen. Draai het pas als
deze versie een tijdje goed loopt.

---

## 3. Gevonden, nog niet gedaan

Op volgorde van wat ik zou aanpakken.

### 1. Dezelfde naam op drie plekken
Een kaart bewaart zijn eigen kopie van de namen, de datum en de locatie, en die
kopie wint van wat er op de bruiloft staat. Verander de namen in de
websitebouwer en de kaarten houden de oude. Niemand heeft per kaart een andere
naam nodig, dus dit is dubbele opslag én een bron van verschil. Mijn advies: de
bruiloft is de waarheid, de kaart bewaart alleen wat echt per kaart verschilt
(gastengroep, uitnodigingszin, tijden, boodschap, foto, animatie, straks taal).

Nu is het moment: er staan nul kaarten in de database, dus er is niets te
migreren. Over een half jaar is dit een migratie met risico.

### 2. Pagina's worden bij elke opslag weggegooid en opnieuw gemaakt
De websitebouwer verwijdert bij elke opslag alle pagina-rijen en maakt ze
opnieuw aan. Dat is acht keer verwijderen en acht keer invoegen per klik op
opslaan, en elke rij krijgt een nieuw id. Een upsert op (event_id, type) is
netter, sneller en laat de ids staan. Met drie bruiloften merk je het niet;
met honderd wel.

### 3. Het wachtwoord van een klantsite staat in de HTML
De sitebeveiliging geeft `pw_value` en `pw_answer` als prop aan een
clientcomponent mee. Wie de bron bekijkt, ziet het wachtwoord. Dat stond er al
voor mijn wijzigingen, dus het is geen nieuwe fout, maar het is wel een
schijnslot. Hoort een controle op de server te zijn. Niet dringend zolang het
om "even niet voor iedereen" gaat, wel voordat je het als beveiliging verkoopt.

### 4. Een onbekende adres op een klantsite geeft HTTP 200
Met een nette "pagina niet gevonden" in beeld, dus voor een gast prima. Voor
Google is het een zachte 404. Niet dringend, want klantsites staan op noindex.

### 5. Horen facturen mee te verdwijnen?
Wie zijn site weggooit, verwijdert nu ook zijn facturen. Voor de boekhouding
lijkt bewaren logischer. Ik heb het gedrag niet veranderd, alleen de vraag in
de code gezet. Jouw beslissing.

### 6. De kennisbank loopt achter
`KENNISBANK.md` is geschreven toen er één product van 49,99 was. Hij kent de
prijsladder, de kaarten en de conceptteller niet. Er staat nu een
waarschuwing boven. Bijwerken is een uurtje en ik doe het graag.

### 7. 146 MB oude worktrees op de schijf
Uit de repo, nog niet van de schijf. Eén ervan heeft één commit die niet in
main zit, over homepage-layouts; die functie zit er inmiddels wel in. Weggooien
kan met `git worktree remove`, maar dat is jouw beslissing omdat er formeel nog
werk in zit.

### 8. Er zijn geen tests
Nul. Alles wat ik test, test ik met de hand tegen de echte database. Dat werkt
zolang ik het doe, maar het betekent dat een wijziging van volgende maand
ongemerkt iets van vandaag kan slopen; precies wat er met de kijkteller en de
voorbeeldweergave gebeurde. Mijn advies: geen testframework en geen honderd
tests, maar één script dat de klantreis naloopt. Dat past bij het plan om de
klantreis toch te gaan testen: maak die test een script in plaats van een
checklist.

### 9. Kleinigheid
De sectie "Tekst op de kaart" in de kaartbouwer kan niet dicht: de knop
schakelt naar dezelfde stand. Of de knop moet werken, of hij moet er niet
uitzien als een knop.

---

## 4. Ideeën

Gerangschikt op wat het oplevert gedeeld door wat het kost. De eerste drie
zou ik echt doen.

### A. Zet de datum in de agenda van de gast (heel klein, veel waard)
De standaardtekst op een Save the Date zegt letterlijk "zet de datum alvast in
je agenda", en er is geen enkele manier om dat te doen. Eén knop onder de kaart
die een agendabestand geeft, en de datum staat in de telefoon van de gast. Dit
is precies waar een Save the Date voor bestaat, en papier kan het niet.

Kost bijna niets: een gegenereerd bestand, geen database, geen nieuwe pagina.

### B. RSVP in de kaart zelf
Je vroeg hiernaar, en ja, ik zou het doen.

Nu verlaat de gast de envelop, komt op een webpagina en vult daar een formulier
in. Elke stap kost je antwoorden. Beter: de gast opent de envelop, leest de
kaart, en direct eronder staat "Kom je?" met ja en nee. Naam erbij, klaar.
Geen tweede pagina, geen tweede laadtijd.

Waarom dit het beste verkoopargument voor Uitnodiging & RSVP is: een papieren
kaart heeft een antwoordkaartje en een postzegel nodig, en de helft komt nooit
terug. Hier is het één tik.

Technisch is het halve werk al gedaan: het endpoint bestaat en is nu ook
afgeschermd, en de kaart is al een clientcomponent. Wat erbij komt is een
formulier in de stijl van het ontwerp, en andere vragen per gastengroep (een
avondgast hoeft niets over het diner te weten).

### C. Een overzicht voor de cateraar
Elke locatie vraagt het bruidspaar om hetzelfde lijstje: hoeveel personen,
hoeveel vegetarisch, welke allergieën, wie blijft slapen. Die gegevens staan er
al. Eén pagina die het optelt en te printen is. Klein werk, en het is het soort
ding waar een bruidspaar over vertelt aan andere bruidsparen.

### D. Een link per gast in plaats van per groep (het grootste idee)
Nu is een kaartlink per gastengroep. Wordt die per gast of per huishouden, dan
kan er ineens veel:

- de kaart begroet de gast bij naam
- de RSVP is voorgevuld: één tik voor ja of nee
- het bruidspaar ziet wie er nog niet heeft geantwoord
- en kan met één knop alleen die mensen een herinnering sturen
- de kijkteller wordt "wie heeft hem geopend", en dat is wat een bruidspaar
  echt wil weten

Dit is volgens mij het waardevolste dat je aan dit product kunt toevoegen,
want "wie heeft er nog niet gereageerd" is de echte pijn van een bruiloft
organiseren. Het maakt van de kijkteller een takenlijst in plaats van een
getal.

Het is ook een logische aanleiding voor een hogere prijs: een gastenlijst met
persoonlijke links en herinneringen is duidelijk meer dan een kaart.

Wat het kost: een tabel gasten, een invoerscherm waar je een lijst plakt,
tokens per gast en een herinneringsknop. Niet klein, maar de kaartweergave en
de mail zijn er al. Let op: dit is persoonsgegevens van gasten, dus dat raakt
jouw punt over de database.

### E. Een deelbare video of GIF van de envelop
De animatie is het wow-moment van het product en is in een advertentie of op
Instagram niet te laten zien. Een knop "deel je kaart als filmpje" geeft het
bruidspaar iets om te posten, en dat is gratis marketing voor precies datgene
wat jou onderscheidt. Ook bruikbaar op je eigen homepage en in de directories.

### F. Stuur jezelf een proefkaart
De grootste twijfel bij een digitale kaart is "hoe komt dit aan bij mijn
gasten". Eén knop die de kaart naar je eigen mailadres stuurt, zoals een gast
hem zou krijgen, haalt die twijfel weg vlak voor het moment van betalen.

### G. Kaartbouwer overzichtelijker
Klein en concreet, in de volgorde waarin ik het zou doen:

1. **Zeg wat er nog mist.** Nu klaag je pas na een klik op activeren. Een
   regeltje "nog nodig: locatie" naast de knop scheelt een doodlopende weg.
2. **Voorbeeldteksten per veld.** Een leeg boodschapveld is de reden dat mensen
   afhaken. Een knopje dat een goede zin invult, met de teksten uit de
   schrijfwijzer die er al ligt.
3. **Ongedaan maken.** Eén misklik op een stijl en je keuze is weg.
4. **Op een telefoon je wijziging zien.** Nu staat het voorbeeld onder het
   formulier, dus je ziet nooit wat je doet. Een klein vast voorbeeld bovenaan
   of een schakelaar tussen bewerken en bekijken.
5. **De drie ontwerpen als echte miniaturen** met de eigen namen en datum erin,
   in plaats van namen als "sierlijk". Een bruidspaar kiest met zijn ogen.

### H. Dashboard beter
1. **Zeg wat de volgende stap is.** Nu is het één lange pagina met vijf
   secties en moet je zelf bedenken wat er te doen valt. Eén strook bovenaan
   per bruiloft: "je kaart staat klaar, verstuur hem" of "drie gasten hebben
   nog niet gereageerd".
2. **Groepeer per bruiloft.** Kaarten en aanmeldingen staan nu in aparte
   secties terwijl ze bij elkaar horen.
3. **Laat zien wanneer een kaart voor het laatst geopend is.** Een getal is
   dood, "vanmiddag om 14:20 nog geopend" leeft.

### I. Kleine dingen die niets kosten
- Een aftelling op de kaart: "nog 84 dagen".
- Een vierkante versie van de kaartafbeelding, voor een WhatsApp-status of
  Instagram. Nu is er alleen staand.
- Bij de RSVP vragen waar de papieren kaart naartoe mag, voor bruidsparen die
  beide doen. Adressen verzamelen is nu een apart Excelletje.

---

## 5. Hoe de vormgeving nu werkt (recept voor de rest)

`#C5A059` stond 115 keer in 38 bestanden, en 28 bestanden definieerden hun
eigen palet met eigen namen. Nu is er één bron:

- **`lib/ontwerp.ts`** met `KLEUR`, `LETTER` en `VORM`. Voor inline stijlen,
  voor satori (de kaartafbeelding) en voor de PDF-factuur, want die twee
  kunnen geen CSS lezen.
- **`app/globals.css`** met dezelfde waarden als CSS-variabelen, plus een
  `@theme`-blok zodat Tailwind-klassen als `text-goud`, `bg-ivoor` en
  `border-goud-licht` werken.

Tailwind is de basis: 2230 `className` tegen 1353 inline `style`, en Tailwind
staat in elk bestand. Inline blijft waar een waarde pas tijdens het draaien
bekend is, zoals de kleur per kaartontwerp of de gemeten stand van de
envelop-animatie. Dat is geen rommel, dat kan niet anders.

**`components/ui.tsx`** heeft de bouwstenen: `Knop`, `Melding`, `Paneel`,
`Veld` en `Draaier`. Twee van de drie dingen die vertrouwen maken zitten erin
gebakken, zodat ze nergens meer vergeten kunnen worden:

- een `Knop` met `bezig` laat een draaiend rondje zien en blokkeert de tweede
  klik
- een `Melding` neemt een `actie` mee, want "opslaan mislukt" zonder volgende
  stap laat iemand met lege handen staan

Het derde, beeld dat verspringt, is per pagina en kan geen bouwsteen zijn.

### Om te zetten
De kaartbouwer en `/start` zijn om, als voorbeeld van het patroon. De rest is
mechanisch: het eigen palet bovenaan een bestand vervangen door de namen uit
`KLEUR`, en losse knoppen en meldingen vervangen door `Knop` en `Melding`. In
volgorde van belang: `/betalen`, `/dashboard`, `/bouwen`, de homepage, en
daarna de admin-pagina's (die ziet alleen Michiel).

Doe het per pagina en kijk er daarna naar. Eén grote zoek-en-vervang over 28
bestanden verandert dingen die niemand meer nakijkt.
