# To-do SayingYes

Persoonlijke actielijst van Michiel. Claude houdt deze bij; afgeronde punten gaan naar onderaan.

## Open

- [ ] **Teksten op /start nog een ronde doorlopen**: de opbouw en stijl staan goed (11 sep 2026), maar de teksten in de drie kaarten en de regel eronder wil Michiel nog aanscherpen. Kies een moment waarop we er met een frisse blik naar kijken.
- [ ] **Kaartbouwer testen** nu de drie ontwerpen live staan: Strak, Sierlijk en Bohemian, watermerk, envelopsimulatie, downloadvoorbeeld en activeren voor 15 euro. Meld wat er niet lekker voelt.
- [ ] **Supabase-waarschuwing in de gaten houden**: "exhausting multiple resources". Niet urgent (database is piepklein), maar kijk in Supabase onder Reports en Database welke resource het is. Bij geheugen dat op 100% blijft staan is dat dezelfde toestand die in juli tot de pauze leidde. Advies van 10 sep 2026: nog niet upgraden, wel checken zodra er echt verkeer komt.
- [ ] **Claude GitHub App installeren** op de repo (https://claude.ai/code/onboarding?magic=github-app-setup), nodig voor de tweewekelijkse artikel-routine. Daarna Claude een seintje geven ("app geinstalleerd"): die maakt dan de routine aan (1e en 15e van de maand, 09:00, artikel als pull request). Akkoord gegeven op 9 sep 2026.
- [ ] **Beslissen over Supabase MCP-koppeling**: zou Claude zelf migraties kunnen draaien. Advies staat in het gesprek van 9 sep 2026: alleen-lezen koppelen (past bij de eigen bouwregel "read-only default"), of niet koppelen en SQL blijven plakken. Niet met volledige schrijfrechten, want de database bevat gastgegevens van klanten.
- [ ] **Vermeldingen in trouwdirectories**: de lijst staat in `docs/BACKLINKS.md` (10 en 11 sep 2026 live gecontroleerd). Begin met ThePerfectWedding en WeddingFinder, allebei gratis. Een telefoonnummer is bij ThePerfectWedding niet verplicht, dus je kunt daar meteen aanmelden; bij Top Trouwbedrijven wordt er wel om gevraagd.
- [ ] **Backlinks van echte sites**: eerst samen bepalen wie we aanschrijven (trouwlocaties, trouwblogs, weddingplanners, leveranciers van onze eigen bruiloft). Claude schrijft daarna de mailteksten en een kandidatenlijst.
- [ ] **sayingyes.be** opzetten: domein koppelen in Vercel (proxy.ts en Analytics ondersteunen `.be` al) of het domein laten vervallen.
- [ ] **Reviews verzamelen** zodra er echte klanten zijn (testimonials op de homepage plus Review-schema).

## Afgerond

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
