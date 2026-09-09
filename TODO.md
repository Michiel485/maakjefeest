# To-do SayingYes

Persoonlijke actielijst van Michiel. Claude houdt deze bij; afgeronde punten gaan naar onderaan.

## Open

- [ ] **Google Search Console**: sitemap opnieuw indienen (`https://www.sayingyes.nl/sitemap.xml`) en via URL-inspectie indexering aanvragen voor de homepage en de drie nieuwe artikelen. Stappen staan in het gesprek van 9 sep 2026.
- [ ] **Bing Webmaster Tools** aanmaken op bing.com/webmasters en "Importeren uit Google Search Console" kiezen. Dekt Bing, DuckDuckGo, Ecosia en Yahoo in een keer.
- [ ] **Backlinks**: outreach naar trouwlocaties, trouwblogs en weddingplanners (Claude schrijft het mailtje en een kandidatenlijst zodra je dit oppakt).
- [ ] **sayingyes.be** opzetten: domein koppelen in Vercel (proxy.ts en Analytics ondersteunen `.be` al) of het domein laten vervallen.
- [ ] **Claude GitHub App installeren** op de repo (https://claude.ai/code/onboarding?magic=github-app-setup), nodig voor de tweewekelijkse artikel-routine. Daarna Claude een seintje geven ("app geïnstalleerd"): die maakt dan de routine aan (1e en 15e van de maand, 09:00, artikel als pull request). Akkoord gegeven op 9 sep 2026.
- [ ] **AVG**: Google Analytics laadt op sayingyes.nl zonder cookie-toestemming; koppelen aan de cookiebanner (consent mode).
- [ ] **Reviews verzamelen** zodra er echte klanten zijn (testimonials op de homepage + Review-schema).

- [ ] **Bezoekersinzicht**: inzicht of een bericht wanneer iemand anders dan Michiel de site bezoekt (bijv. dagelijkse/wekelijkse mail met echte bezoekers, eigen IP uitgesloten; opties: GA4-rapport, Vercel Analytics of een eigen cron-mail).
- [ ] **Uitzoeken: zelf extra sites over trouwen bouwen met links naar sayingyes.nl?** Beoordelen of dat helpt of juist risico geeft (Google ziet eigen linknetwerken als linkschema); alternatief afwegen: die energie in content op sayingyes.nl en echte partnerlinks steken.

## Afgerond

- [x] 9 sep 2026: SEO-ronde (www-canonicals, structured data, FAQ, snellere homepage, 3 artikelen, eigen 404) en frames geoptimaliseerd.
- [x] 8 sep 2026: Supabase hersteld na pauze, CRON_SECRET ingesteld, cron werkt.
