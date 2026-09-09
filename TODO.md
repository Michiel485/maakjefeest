# To-do SayingYes

Persoonlijke actielijst van Michiel. Claude houdt deze bij; afgeronde punten gaan naar onderaan.

## Open

- [ ] **Bezoekersinzicht aanzetten**: gebouwd op 9 sep 2026 (anonieme telling zonder cookies, plus een dagelijkse mail rond 10:00 naar ADMIN_EMAIL, alleen als er bezoek was). Nog twee stappen: `supabase/migration_page_views.sql` in de Supabase SQL editor draaien, en op elk eigen apparaat een keer sayingyes.nl/admin openen zodat je eigen bezoeken niet meetellen.
- [ ] **Bing Webmaster Tools** aanmaken op bing.com/webmasters en "Importeren uit Google Search Console" kiezen. Dekt Bing, DuckDuckGo, Ecosia en Yahoo in een keer.
- [ ] **Claude GitHub App installeren** op de repo (https://claude.ai/code/onboarding?magic=github-app-setup), nodig voor de tweewekelijkse artikel-routine. Daarna Claude een seintje geven ("app geinstalleerd"): die maakt dan de routine aan (1e en 15e van de maand, 09:00, artikel als pull request). Akkoord gegeven op 9 sep 2026.
- [ ] **Backlinks**: eerst samen bepalen wie we aanschrijven (trouwlocaties, trouwblogs, weddingplanners, leveranciers van onze eigen bruiloft). Claude schrijft daarna de mailteksten en een kandidatenlijst. Bewust nog niet gedaan op 9 sep 2026.
- [ ] **sayingyes.be** opzetten: domein koppelen in Vercel (proxy.ts en Analytics ondersteunen `.be` al) of het domein laten vervallen.
- [ ] **Reviews verzamelen** zodra er echte klanten zijn (testimonials op de homepage plus Review-schema).

## Afgerond

- [x] 9 sep 2026: Bezoekersinzicht gebouwd: anonieme paginateller zonder cookies (`/api/track`, tabel `page_views`, 90 dagen bewaartermijn) en een dagelijks overzicht per mail vanuit de bestaande cron.
- [x] 9 sep 2026: AVG afgerond: Google Analytics laadt alleen na toestemming (geverifieerd op productie) en toestemming intrekken kan nu met een knop op de privacypagina. Privacyverklaring aangevuld met de anonieme statistieken.
- [x] 9 sep 2026: Google Search Console: sitemap opnieuw ingediend en indexering aangevraagd voor de homepage en de nieuwe artikelen.
- [x] 9 sep 2026: Uitgezocht en besloten: zelf satellietsites bouwen met links naar sayingyes.nl doen we niet. Google ziet dat als een linkschema (nul effect tot risico op straf); alleen zinvol als zo'n site zelfstandig waardevol is. Energie gaat naar artikelen op sayingyes.nl en echte partnerlinks.
- [x] 9 sep 2026: SEO-ronde (www-canonicals, structured data, FAQ, snellere homepage, 3 artikelen, eigen 404) en kaderafbeeldingen geoptimaliseerd.
- [x] 8 sep 2026: Supabase hersteld na pauze, CRON_SECRET ingesteld, cron werkt.
