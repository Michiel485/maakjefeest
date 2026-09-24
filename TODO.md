# To-do SayingYes

Persoonlijke actielijst van Michiel. Claude houdt deze bij; afgeronde punten gaan naar onderaan.

## Open

- [ ] **Per gast een WhatsApp-knop in de gastenlijst**: één tik opent WhatsApp met de persoonlijke link van die gast en de tekst al ingevuld, en de lijst zet hem vanzelf op verstuurd. Dan weet je precies wie de kaart kreeg en wie nog stil is, zonder tachtig links met de hand te maken. Kosten zijn verwaarloosbaar (een code per gast in de database, dezelfde kaartpagina). De algemene link blijft de standaard. Besproken 24 sep 2026; nu nog niet bouwen.
- [ ] **Websitebouwer in stukken knippen**: `/bouwen` laadt één script van 494 kB (ongecomprimeerd; de kaartbouwer 200 kB, het dashboard 70 kB). Sinds 22 sep 2026 worden de andere tabbladen alvast opgehaald, dus wisselen voelt snel, maar de eerste keer openen blijft zwaar op een telefoon. De acht pagina-editors en de Sophie-tutorial pas laden als ze open gaan (`next/dynamic`). Hoort bij stap 5, want dan gaan die editors toch onder handen.
- [ ] **Teksten op /start nog een ronde doorlopen**: de opbouw en stijl staan goed (11 sep 2026), maar de teksten in de drie kaarten en de regel eronder wil Michiel nog aanscherpen. Kies een moment waarop we er met een frisse blik naar kijken.
- [ ] **Kaartbouwer testen** nu de drie ontwerpen live staan: Strak, Sierlijk en Bohemian, watermerk, envelopsimulatie, downloadvoorbeeld en activeren voor 15 euro. Meld wat er niet lekker voelt.
- [ ] **Supabase-waarschuwing in de gaten houden**: "exhausting multiple resources". Niet urgent (database is piepklein), maar kijk in Supabase onder Reports en Database welke resource het is. Bij geheugen dat op 100% blijft staan is dat dezelfde toestand die in juli tot de pauze leidde. Advies van 10 sep 2026: nog niet upgraden, wel checken zodra er echt verkeer komt.
- [ ] **Claude GitHub App installeren** op de repo (https://claude.ai/code/onboarding?magic=github-app-setup), nodig voor de tweewekelijkse artikel-routine. Daarna Claude een seintje geven ("app geinstalleerd"): die maakt dan de routine aan (1e en 15e van de maand, 09:00, artikel als pull request). Akkoord gegeven op 9 sep 2026.
- [ ] **Beslissen over Supabase MCP-koppeling**: zou Claude zelf migraties kunnen draaien. Advies staat in het gesprek van 9 sep 2026: alleen-lezen koppelen (past bij de eigen bouwregel "read-only default"), of niet koppelen en SQL blijven plakken. Niet met volledige schrijfrechten, want de database bevat gastgegevens van klanten.
- [ ] **Vermeldingen in trouwdirectories**: de lijst staat in `docs/BACKLINKS.md` (10 en 11 sep 2026 live gecontroleerd). Begin met ThePerfectWedding en WeddingFinder, allebei gratis. Een telefoonnummer is bij ThePerfectWedding niet verplicht, dus je kunt daar meteen aanmelden; bij Top Trouwbedrijven wordt er wel om gevraagd.
- [ ] **Backlinks van echte sites**: eerst samen bepalen wie we aanschrijven (trouwlocaties, trouwblogs, weddingplanners, leveranciers van onze eigen bruiloft). Claude schrijft daarna de mailteksten en een kandidatenlijst.
- [ ] **sayingyes.be** opzetten: domein koppelen in Vercel (proxy.ts en Analytics ondersteunen `.be` al) of het domein laten vervallen.
- [ ] **Deadline definitieve aantallen**: in het volledige pakket kan de klant een datum zetten waarop hij zijn definitieve gastenlijst bij de locatie of cateraar moet hebben, met de naam van die locatie erbij. Standaard twee weken vooraf (bij Michiels locatie was het een week; hij stelt twee weken voor als veilige standaard). Wij herinneren hem daarvoor, en vragen erna of het gelukt is. Komt uit Michiels eigen bruiloft: hij was te laat, de locatie had de inkoop al gedaan en hij betaalde voor gasten die niet kwamen. Versturen blijft van de klant, wij herinneren alleen. Uitgewerkt in het klantreisgesprek van 21 sep 2026.
- [ ] **QR-code naar de digitale trouwkaart** als losse optie bij een fysieke kaart: wie papier verstuurt krijgt van ons een QR-code, de gast komt op de digitale trouwkaart, vult daar de hele RSVP in en kan door naar de website. Michiels idee van 21 sep 2026, verkoopt aan de groep die de papieren kaart niet wil opgeven.
- [ ] **Alle pagina's en USP's nalopen** zodra de bouw af is. Michiels punt van 21 sep 2026 na een test: op de betaalpagina staan bij Save the Date geen verkoopargumenten, terwijl de gastenlijst daar juist genoemd hoort te worden. Doe dit in één ronde over de homepage, /start, /digitale-uitnodiging, de betaalpagina en de mails, zodat de woorden overal hetzelfde zijn. Let er ook op dat je op de betaalpagina nog van pakket kunt wisselen; dat is niet fout, maar bepaal of we dat willen.

- [ ] **`migration_adres.sql` draaien** (één kolom op rsvp: `adres`). Zonder werkt alles, maar dan slaat een aanmelding het adres over dat een gast invult bij "Aanwezig ja/nee, met adres". De SQL staat in het gesprek van 22 sep 2026 en in `supabase/migration_adres.sql`.
- [ ] **Stap 5: de binnenkant van de websitebouwer in dezelfde stijl** als de kaartbouwer: de acht pagina-editors met hun schuifjes, kleurkiezers en invoervelden. Per sectie, als het rustig is, en alleen vorm, geen gedrag. De schil, de kop en de sectiekoppen zijn al gedeeld; dit is wat nog verschilt. Afspraak van 21 sep 2026.
- [ ] **Fasegrenzen verschuiven**: `lib/fasen.ts` kan al met eigen grenzen werken, maar er is geen opslag en geen scherm voor. Advies van 21 sep 2026: nog niet bouwen. Wie voorloopt wordt al vooruit geduwd door wat hij gedaan heeft, en wie achterloopt hoort juist het aftellen te zien; dat is haast, geen fout. Het echte geval dat wel bestaat is iemand die bewust geen Save the Date stuurt en daar maanden een tegel voor ziet. Dan is "ik doe geen Save the Date" een betere oplossing dan maanden verschuiven.
- [ ] **Klantreis als klant doorlopen** nu de bouw verder is: van gratis starten, ontwerpen, bewaren, gastenlijst, versturen, reacties, najagen, aantallen naar de locatie, tot de fotomuur. Nog nooit gedaan. Claude kan niet inloggen, dus dit moet Michiel zelf doen.

- [ ] **Korte tutorial bij gratis starten**: vier of vijf schermen die laten zien wat er allemaal is (kaart, website, gastenlijst, fotomuur), zodat de klant weet dat het bestaat voordat hij begint. Michiels idee van 21 sep 2026. Voorwaarden uit dat gesprek: overslaan met één klik en die knop direct zichtbaar, eenmalig, en daarna terug te vinden vanuit het dashboard. Meten met de eigen bezoekersteller of wie hem ziet vaker of minder vaak een ontwerp afmaakt dan wie hem overslaat.

- [ ] **Checklist bruiloft plannen** in het dashboard: alle standaardzaken rondom een bruiloft die wij kunnen bedenken, afvinkbaar. Michiels tegenvoorstel (21 sep 2026) voor het kladblok-idee, dat hij te vaag en foutgevoelig vond. Dit is dezelfde kennis als artikel 21 maar als lijst in het product, en het vult moment 5, de stille maanden tussen de Save the Date en de trouwkaart.
- [ ] **Maandmail met een tussenstand**: eens per maand de stand van de reacties plus wat er in die fase van de planning speelt, met een link naar het dashboard. Leuk idee volgens Michiel, genoteerd voor later. Let op zijn punt: veel verschillende mails op vaste momenten is foutgevoelig, dus liever weinig soorten mails die uit de data volgen. Advies staat in het gesprek van 21 sep 2026.

- [ ] **Partnerschappen voor de stille maanden** (moment 5 in de klantreis, tien tot zes maanden vooraf): photobooth, catering, andere leveranciers met iets unieks. Pas oppakken als er klanten zijn, maar de klantreis houdt er nu al ruimte voor. Idee van Michiel, 21 sep 2026.

- [ ] **Reviews verzamelen** zodra er echte klanten zijn (testimonials op de homepage plus Review-schema).

## Afgerond

- [x] 22 sep 2026 (avond): **Alles op de regel zelf.** Elke kaart en de website hebben in het dashboard een knop Acties (bewerken, bekijken, delen, QR, webadres, verlengen, hernoemen, verwijderen); de blokken "Je kaarten delen" en "Beheer" eronder zijn weg, weggooien staat bij Instellingen. Kaarten en de website kunnen een eigen naam krijgen. De kaartenlijst staat er vanaf de eerste kaart, de websitetegel toont je concept en geldigheid, de trouwkaarttegel rekent de bijbetaling. Gastenlijst vullen kan vanaf het eerste bewaarde ontwerp. Wisselen tussen tabbladen haalt de andere onderdelen alvast op en de websitebouwer bewaart eerst; niet-bewaard werk staat in de browser en de browser waarschuwt alleen als er echt iets verloren gaat. Testronde zonder inloggen: alle routes en homepage-links 200, geen horizontale overloop op 375 px, overdracht kaart naar website werkt, herlaad in de websitebouwer houdt je werk. Later die dag: kaarten in het dashboard als lijst waarin je een kaart kiest (dubbelklik is hernoemen), met eronder Link voor je gasten, Verder ontwerpen en Verwijderen; niet-geactiveerd geeft de linkknop een venster met de prijs en wat je ervoor krijgt. Dashboard laadt zijn gegevens tegelijk in plaats van na elkaar en toont meteen een skelet.
- [x] 21 sep 2026 (avond): **Eén bruiloft, één schil.** Dashboard en beide bouwers wonen in dezelfde schil (`components/BouwerSchil.tsx`) met vier tabbladen; op de telefoon een hamburgermenu en een vaste knoppenbalk onderaan, in de kaartbouwer het voorbeeld boven de secties. Dashboard herbouwd volgens de gekozen schets: bruiloft, teller, vier tegels, één regel onderaan; checklist en instellingen op eigen pagina's; alles uit echte data, niets uit de kalender; wat niet gekocht is staat grijs. Ook zichtbaar zonder inloggen, zodat Start gratis daar landt en het lege dashboard de pakketkeuze is. Algemene info bovenaan beide bouwers; websitebouwer begint leeg en wacht op namen en datum; `/aanmaken` is een doorverwijzing; conceptkeuzelijst weg. Gastenlijst toont welke kaart een gast kreeg, met keuzelijst bij verstuurd zetten (`migration_gekregen.sql` nog draaien). Stap 5, de binnenkant van de websitebouwer in dezelfde stijl, is bewust nog niet gedaan: per sectie, als het rustig is.

- [x] 21 sep 2026: **De klantreis in het product.** Het dashboard volgt nu zes fasen die uit de trouwdatum en uit wat er gedaan is worden gerekend, met drie banden: Nu met hoogstens drie tegels, Straks met wat er aankomt, en Altijd. Daarbij een checklist van 32 punten over de hele bruiloft waarvan negen zichzelf afvinken, de deadline voor je aantallen bij de locatie met drie berichten, de keuze hoe vaak je een tussenstand wilt horen met de mail erachter, een QR-code naar je digitale kaart voor op je papieren kaart, de keuze daggasten of avondgasten per kaart, en een echte overdracht na het eerste bewaren waar de gastenlijst voor het eerst ter sprake komt. Twee migraties gedraaid en gecontroleerd. Onderweg bleek `concept_naam` nooit gedraaid te zijn, waardoor de kaartbouwer helemaal niets kon bewaren; dat is gerepareerd en aanmaken en bijwerken proberen het nu opnieuw zonder kolommen die na een migratie komen.


- [x] 20 sep 2026: **Conceptherinneringen per pakket.** Wie een Save the Date opsloeg kreeg een mail over een trouwwebsite van €49,99 met een knop naar de verkeerde bouwer. Nu één mail per moment met de woorden per pakket uit `lib/plans.ts`, geen aparte mails per product. Bewaartermijnen: kaarten 182 dagen (herinneringen op dag 42, 91, 175), website 70 dagen (dag 42, 63), waarbij de laatste de aankondiging is dat het ontwerp verdwijnt. Het verwijderen haalt nu ook de geüploade foto's uit de opslag; die bleven eerder voor altijd staan. Migratie gedraaid en getest tegen de echte database met vijf testconcepten, echte data onaangeroerd, testdata opgeruimd.

- [x] 11 sep 2026: **Drie kaartontwerpen staan live** (commit ed23c9a). Migratie `migration_card_designs.sql` gedraaid en gecontroleerd: klassiek, sierlijk, bohemian en foto mogen in de database, iets anders wordt geweigerd. Watermerk is lichter in de bouwer en in de gastenweergave, witregels blijven in de kaarttekst staan, standaardtekst zegt nu dat het om een bruiloft gaat, en het kaartvoorbeeld is uit de websitebouwer gehaald. Build groen, testrijen opgeruimd.

- [x] 10 sep 2026: **Kaartbouwer gebouwd** (`/kaart-maken`, twee standen: Save the Date en trouwkaart). Anoniem ontwerpen met live kaartvoorbeeld, tekst bewerken, stijl, foto, envelopsimulatie en downloadvoorbeeld met watermerk, e-mailadres pas bij bewaren of activeren, event ontstaat pas op dat moment. Landingspagina, homepage en dashboard linken ernaar. Welkomstmail kent het pakket. Getest in de browser, build groen.

- [x] 10 sep 2026: **Prijsladder staat live** (commits d5a9cfd, d2a5dd8, b6d3173). Migratie gedraaid, hele flow getest tegen de echte database (pakketpoorten, kaartlink voor en na betalen, publieke pagina's per pakket, envelopknoppen), testdata opgeruimd en op productie geverifieerd: homepage met drie pakketten, landingspagina, twee nieuwe artikelen, sitemap 17 URLs en de bestaande klantsite werkt nog.

- [x] 10 sep 2026: Prijsladder afgemaakt na een controleronde: pakketcontrole in het RSVP-endpoint en op alle fotomuur-routes, kaartlink werkt pas na betaling (bruidspaar ziet een voorbeeld met strook), bouwer en aanmaakpagina volgen het pakket, dashboard zet de kaarten bovenaan en verbergt wat niet bij het pakket hoort, verlengen alleen bij Compleet en kaartpakketten zonder einddatum, plus kastlijntjes uit de klantteksten. Pakketlogica lokaal getest, build groen.

- [x] 9 sep 2026: Prijsladder gebouwd (nog niet live): drie pakketten Save the Date (15), Uitnodiging & RSVP (25) en Trouwwebsite compleet (49,99) op een product, upgraden voor het verschil, publieke site en dashboard per pakket, nieuwe landingspagina /digitale-uitnodiging, homepage omgegooid, twee artikelen over trouwkaarttekst. Plan staat in `docs/PLAN-prijsladder.md`.
- [x] 9 sep 2026: Zoekwoordonderzoek: trouwwebsite-termen worden in Nederland nauwelijks gezocht, kaart- en uitnodigingtermen wel; Engelse term wedding website is de grootste (expats rond Amsterdam). Cijfers in het geheugen van Claude.

- [x] 9 sep 2026: Bing Webmaster Tools staat aan voor https://www.sayingyes.nl. Sitemap ingediend en direct gecrawld: 14 URLs gevonden, 0 fouten, 0 waarschuwingen. Daarmee komen Bing, DuckDuckGo, Yahoo en Ecosia mee. Er is een property in Bing (de www-versie, in de sitekiezer weergegeven als sayingyes.nl).

- [x] 9 sep 2026: Bezoekersinzicht staat aan. Migratie gedraaid, teller op productie getest (paginaweergave landde met pad, land NL, apparaat en anonieme hash), overzichtsquery gecontroleerd en testdata opgeruimd. Vanaf morgen komt er rond 10:00 een mail als er bezoek was.

- [x] 9 sep 2026: SEO-controle na de sitemap-indiening: alle 14 pagina's geven 200 en zijn indexeerbaar. Drie bevindingen opgelost: canonical van contact, privacy en voorwaarden wees naar de homepage (duplicaatrisico), vier artikeltitels waren te lang voor Google, en de omschrijvingen van de homepage, privacy en drie artikelen zitten nu binnen 70 tot 160 tekens.
- [x] 9 sep 2026: Bezoekersinzicht gebouwd: anonieme paginateller zonder cookies (`/api/track`, tabel `page_views`, 90 dagen bewaartermijn) en een dagelijks overzicht per mail vanuit de bestaande cron.
- [x] 9 sep 2026: AVG afgerond: Google Analytics laadt alleen na toestemming (geverifieerd op productie) en toestemming intrekken kan nu met een knop op de privacypagina. Privacyverklaring aangevuld met de anonieme statistieken.
- [x] 9 sep 2026: Google Search Console: sitemap opnieuw ingediend en indexering aangevraagd voor de homepage en de nieuwe artikelen.
- [x] 9 sep 2026: Uitgezocht en besloten: zelf satellietsites bouwen met links naar sayingyes.nl doen we niet. Google ziet dat als een linkschema (nul effect tot risico op straf); alleen zinvol als zo'n site zelfstandig waardevol is. Energie gaat naar artikelen op sayingyes.nl en echte partnerlinks.
- [x] 9 sep 2026: SEO-ronde (www-canonicals, structured data, FAQ, snellere homepage, 3 artikelen, eigen 404) en kaderafbeeldingen geoptimaliseerd.
- [x] 8 sep 2026: Supabase hersteld na pauze, CRON_SECRET ingesteld, cron werkt.

## Klein en nog open (20 sep 2026)
- Een onbekende slug op /events/[slug] geeft nu HTTP 200 met een nette
  "pagina niet gevonden" in beeld. Voor een gast is dat prima, voor Google een
  soft 404. Niet dringend, want klantsites staan op noindex.
- KENNISBANK.md bijwerken: geschreven bij één product van 49,99, kent de
  prijsladder, de kaarten en de conceptteller nog niet. Er staat nu een
  waarschuwing boven.
- Vraag: horen de facturen van een site mee te verdwijnen als het bruidspaar
  die site weggooit? Nu gebeurt dat wel. Voor de boekhouding lijkt bewaren
  logischer. Zie lib/opruimen.ts.
- ~~supabase/migration_opruimen_dode_kolommen.sql draaien~~ gedaan op
  20 september 2026, nagekeken en in orde.
- Twee oude agent-worktrees staan nog op de schijf onder .claude/worktrees
  (146 MB). Uit de repo gehaald, maar nog niet van de schijf. Een ervan heeft
  één commit die niet in main zit, over homepage-layouts; die functie zit er
  inmiddels wel in. Weggooien kan met `git worktree remove`.
- Vormgeving omzetten naar lib/ontwerp.ts en components/ui.tsx. De
  kaartbouwer en /start zijn om als voorbeeld; recept staat in
  docs/AUDIT-en-ideeen.md deel 5. Volgorde: /betalen, /dashboard, /bouwen,
  homepage, daarna admin.
- Taal van de bouwer en de marketingsite (Engels voor expats), met de taal in
  het pad: sayingyes.nl/en/... Los van de kaarttaal, die is af. Advies en
  uitleg in docs/PLAN-afmaken.md.

## Uit de ronde van 20 september, nog open
- HERINNERING VOOR CLAUDE: Michiel wil dat ik hem aan de klantreistest herinner
  zodra we wat verder zijn (punt 3.8 uit docs/AUDIT-en-ideeen.md). Eén script
  dat de hele reis naloopt, geen testframework.
- De inhoud van een klantsite met wachtwoord staat nog wel in de broncode. Het
  wachtwoord zelf niet meer. Zie docs/AUDIT-en-ideeen.md deel 3, punt 3.
- Samen uitdenken: de gastenlijst met een link per gast (idee D) en de
  deelbare video of GIF van de envelop (idee E).
- Eigen RSVP-vragen kunnen nu alleen ja of nee (custom_answer en
  custom_answer_2 zijn booleans) en het zijn er precies twee. Vragen met een
  tekstantwoord of een keuzelijst, en zoveel als je wilt, zou meer waard zijn
  dan welke vaste vraag ook. Zie docs/PLAN-gastenlijst.md deel 7.
