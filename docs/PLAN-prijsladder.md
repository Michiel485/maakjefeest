# Plan: van trouwwebsite naar prijsladder (kaart eerst, site erachter)

Besloten op 9 september 2026. Aanleiding: zoekwoordonderzoek laat zien dat Nederlanders niet zoeken naar "trouwwebsite maken" (relatief volume 0,3) maar wel naar uitnodigingen en kaarten ("uitnodiging bruiloft" 12, "trouwkaarten" 48,8). De uitnodiging wordt daarom het instapproduct; de complete trouwwebsite blijft het hoofdproduct.

## De drie pakketten

Eén product, drie niveaus. Een event heeft een `plan`; upgraden is het verschil bijbetalen, alle gegevens blijven staan.

| Pakket | Prijs | Moment | Wat zit erin |
|---|---|---|---|
| **Save the Date** | € 15,00 | 6 tot 12 maanden vooraf | Save the Date-kaart als envelop-link (WhatsApp), PNG-download, kijkteller. Subdomein toont alleen namen en datum. |
| **Uitnodiging & RSVP** | € 25,00 | 3 tot 4 maanden vooraf | Alles van Save the Date, plus trouwkaarten per gastengroep (dag, avond, receptie) met tijden en eigen tekst, een RSVP-pagina op het subdomein en het RSVP-dashboard met dieetwensen en export. |
| **Trouwwebsite compleet** | € 49,99 | Zodra jullie alles willen delen | Alles, plus de volledige site: programma, informatie, cadeautips, ons verhaal, fotogalerij, ceremoniemeesters, wachtwoord, zes talen, thema's en de gastenfotomuur. |

Upgrades: Save the Date naar Uitnodiging € 10,00; Save the Date naar Compleet € 34,99; Uitnodiging naar Compleet € 24,99.

## Regels

- **Geldigheid**: de kaartpakketten hebben geen einddatum (de kaartlink blijft werken, er gaat niets offline). Het pakket Compleet is geldig tot de laatste van (betaaldatum + 12 maanden) en (trouwdatum + 1 maand); verlengen kost € 22 per zes maanden en wordt alleen bij Compleet aangeboden.
- **Bestaande events** krijgen automatisch `compleet` (migratie), niemand verliest iets.
- **Kortingscodes** werken op de pakketprijs bij eerste aankoop; gratis-codes activeren het gekozen pakket. Op upgrades geen kortingscodes.
- **Facturen** vermelden het pakket; bij upgrade "Upgrade naar ...".
- **Publieke site per pakket**: bij Save the Date is er geen publieke pagina (404); Uitnodiging toont hero plus RSVP op één pagina; Compleet toont alles. Kaart-links tonen alleen knoppen die bij het pakket horen, en alleen zolang de site live is.
- **Kaartlink is het product**: een kaart van een nog niet betaald event is alleen zichtbaar voor het bruidspaar zelf (met een voorbeeldstrook). Gasten zien "nog niet verstuurd" met een link naar de landingspagina.
- **Dashboard**: kaarten voor alle pakketten (bij Save the Date alleen dat kaarttype), RSVP-overzicht vanaf Uitnodiging, fotomuur alleen bij Compleet. Elk event toont zijn pakket en een upgrade-knop.

## Bouwvolgorde

1. `lib/plans.ts` (prijzen, rechten, upgradeprijs, geldigheid) en migratie `supabase/migration_plans.sql`.
2. Kassa: `/api/checkout` (pakket en upgrade), `/api/discount` (pakketprijs), webhook (plan zetten, upgrade verwerken, geldigheidsregel), `/api/activate-free`, `/api/events/[id]` (plan teruggeven), `/api/cards` (kaarttype per pakket).
3. Publieke site: layout, homepage en subpagina van het event, kaartpagina.
4. Dashboard, betaalpagina met pakketkeuze en upgrade, succespagina, builder-knop, aanmaakpagina.
5. Mail: pakketbevestiging voor Save the Date en Uitnodiging; bestaande "site live"-mail blijft voor Compleet.
6. Marketing: landingspagina `/digitale-uitnodiging`, homepage (titel, hero, prijzen, FAQ, CTA), root-metadata, sitemap, schrijfwijzer, artikelen.
7. Controle: typecheck, lint, build, lokale test van kassa-flow en publieke pagina's, dan migratie laten draaien en pushen.

## Later (niet in deze bouw)

- Upgrade-nudges vanuit de cron op basis van de trouwdatum ("nog drie maanden: tijd voor de uitnodiging met RSVP?").
- Engelse landingspagina met aanmeldlijst om de expat-vraag ("wedding website", volume 19) te testen.
- IndexNow-ping naar Bing bij nieuwe artikelen.
