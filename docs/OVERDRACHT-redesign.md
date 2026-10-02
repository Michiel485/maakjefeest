# Overdracht: ontwerpronde trouwwebsite (1 oktober 2026)

Voor het nieuwe gesprek waarin we de klantsite (de trouwwebsite die een bruidspaar bouwt) opnieuw onder handen nemen. Geschreven aan het eind van een lang gesprek; de stand van de code is commit `9aa56c1`, live en goedgekeurd.

## Wat Michiel vraagt

Hij heeft de site met oudere Claude-modellen gebouwd en wil er met een sterker model opnieuw naar kijken: wat kan er qua ontwerp beter. Alles in één ronde. Zijn punten:

1. **Homepage bouwen**: de manier waarop je de homepage bouwt, zodat er echt een mooie homepage uitkomt.
2. **Ons verhaal**: kan dit leuker of beter?
3. **Programma**: leuk bedacht met de icoontjes, maar hoe het uiteindelijk op het scherm komt ziet er saai uit. Naar een next level.
4. **Praktische info en cadeautips**: daar is hij tevreden over. Niet omgooien, hooguit meenemen in de samenhang.
5. **Ceremoniemeesters**: is goed, maar hij is benieuwd of er iets beters te bedenken is.
6. **RSVP-formulier**: kan zeker veel mooier en beter.
7. **Alles op één pagina**: kan de site dan meer één geheel worden, met onderdelen die duidelijk gescheiden zijn of mooi in elkaar overlopen?
8. **Menu bovenaan**: scrolt mee weg, dus onderaan kun je niet even naar een ander onderdeel springen. Moet blijven staan.
9. **Wauw-effect**: wat kunnen we nog meer bedenken om de site naar een hoger niveau te tillen?

## Afspraken met Michiel (gelden altijd)

- **Eerst een plan, dan bouwen.** Hij wil eerst zien wat je voorstelt en akkoord geven. Voor deze ronde: per punt een voorstel, liefst als schets (een artifact, zoals de dashboardschets van 21 sep 2026), met waar nodig twee of drie richtingen om uit te kiezen.
- **Antwoorden in het Nederlands, zonder kastlijntjes** (geen streepjes als gedachtestreep). Gewone woorden, geen jargon.
- **Telefoon is even belangrijk als desktop.** Elke stap testen op 375 px breed én op desktop, in meerdere stijlen.
- **Deployen alleen met `git push`** (GitHub zet het door naar Vercel), nooit `npx vercel --prod`. Pushes bundelen, geen lege commits.
- **SQL-migraties voluit in de chat plakken**, niet alleen het bestandspad. Michiel draait ze zelf in Supabase.
- **Echte kaartlinks niet openen**: dat telt als bekeken bij het bruidspaar.
- **Less is more**: niets toevoegen wat er staat als er geen inhoud is.

## Waar zit wat

| Onderdeel | Bestand |
|---|---|
| Kader van de site, menu, voettekst, beginscherm vanaf de kaart | `app/events/[slug]/layout.tsx` |
| Menu bovenaan (drie indelingen: split, stacked, left) | `app/events/[slug]/event-nav.tsx` |
| Homepage, en bij één pagina alle secties onder elkaar | `app/events/[slug]/page.tsx` |
| Losse subpagina's (alleen pakket Compleet met losse pagina's) | `app/events/[slug]/[type]/page.tsx` |
| Welke sectie welk onderdeel tekent | `app/events/[slug]/EventPageSection.tsx` |
| Homepage zelf | `components/EventHomePreview.tsx`, `components/HomeOntwerp.tsx`, paneel in de bouwer `components/HomeOntwerpPaneel.tsx` |
| Ons verhaal | `components/StoryPreview.tsx` |
| Programma | `components/EventProgramPreview.tsx` |
| Ceremoniemeesters | `components/EventMastersPreview.tsx` |
| Praktische info, cadeautips | `components/PraktischPreview.tsx`, `components/WishlistPreview.tsx` |
| RSVP-formulier (ook gebruikt op de trouwkaart) | `components/AanmeldFormulier.tsx` |
| Stijlen (kleuren, lettertypes, sierlijsten per ontwerp) | `lib/event-styles.ts`, via `getStyleConfig` |
| Websitebouwer met alle editors (4554 regels) | `app/bouwen/page.tsx` |
| Pakketten en wat welk pakket mag | `lib/plans.ts` |

De `*Preview`-onderdelen worden zowel in de bouwer als op de echte site gebruikt. Een ontwerpwijziging moet dus in beide goed staan.

Hoe de data loopt: een bruiloft is een rij in `events` (stijl, lettertypes, `homepage_settings` als JSON, `plan`). Elke sectie is een rij in `pages` met `type`, `content` (JSON), `order` en `is_enabled`. Eén pagina of losse pagina's: `homepage_settings.pageMode === "single"`, en bij elk pakket behalve Compleet is het altijd één pagina.

## Aanwijzingen die ik al heb gezien

- **Menu blijft niet staan**: de `<nav>` heeft al `sticky top-0` (`event-nav.tsx` rond regel 233 en 269), maar Michiel ziet het meescrollen. Eerst uitzoeken welke ouder het breekt. Kandidaten: het kader in `layout.tsx` rond regel 98 (`overflow-clip`, afgeronde hoeken, schaduw) en de bovenruimte `sm:py-12` eromheen. Bij één pagina is een menu dat blijft staan en meekleurt met de sectie waar je bent een logische stap.
- **Eén pagina**: nu staan de secties gewoon onder elkaar in `page.tsx` met `scrollMarginTop: 64`. Er zit geen overgang, scheiding of ritme tussen.
- **Beginscherm vanaf de kaart**: wie op de trouwkaart op "Bekijk onze website" tikt, ziet de kaart als twee deuren openzwaaien (`components/kaart/SiteDeuren.tsx`) en daarna het beginscherm met de namen (`components/SiteOpening.tsx`, `lib/site-opening.ts`). De site pakt dat op met `?van=kaart`. Dit is pas gebouwd en Michiel vindt het leuk; een nieuwe homepage moet daar mooi op aansluiten.
- **Homepage-instellingen** zijn net uitgebreid met tijden en dresscode in de stijl van de trouwkaart (`detailsStijl`, `detailsIcoon`). Niet weggooien zonder vervanging.
- **Lettertypes** staan sinds 1 okt in `app/fonts` (`next/font/local`). Een paar stijlen laden nog een schuine Cormorant en Pinyon Script bij Google via `fontImport` in `lib/event-styles.ts` (staat in TODO.md). Nieuwe lettertypes dus ook lokaal toevoegen, niet via Google.
- **Stap 5 uit TODO.md** (de editors in de websitebouwer in de stijl van de kaartbouwer) en het opknippen van de bouwer met `next/dynamic` passen goed bij deze ronde, omdat de editors toch aangepakt worden.

## Testen

- Dev server: `preview_start` met naam `dev`.
- Er staat één gepubliceerde testbruiloft van Michiel: lokaal `/events/de-bruiloft-van-michiel-en-lindsey`, pakket Compleet, zonder wachtwoord. Daarmee `?van=kaart` proberen kan, de kaartlinks zelf niet openen.
- Test elke sectie in meerdere stijlen (onder andere Strak, Sierlijk en Bohemian; bohemian heeft eigen letterschaal en bloemen) en met lege inhoud.

## Voorgestelde werkwijze

1. Lees de bestanden hierboven en bekijk de testsite in de browser, op desktop en op 375 px.
2. Maak één voorstel voor de hele ronde, per punt 1 t/m 9, met schetsen. Geef bij elk punt aan wat het oplevert voor de gast en wat het kost aan bouwwerk.
3. Michiel kiest. Daarna bouwen in een paar rondes (bijvoorbeeld eerst menu en één pagina, dan homepage, dan programma en verhaal, dan RSVP en ceremoniemeesters), per ronde getest en één keer gepusht.
