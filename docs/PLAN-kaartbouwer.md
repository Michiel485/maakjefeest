# Plan: de kaartbouwer

Besloten op 10 september 2026, na de eerste echte test van de prijsladder. De websitebouwer met een kaartplaatje erin bleek geen product: alleen de stijl deed iets, tekst was niet te bewerken en de envelop was niet te zien. Niemand betaalt daar € 15 voor.

## Uitgangspunten

- **Drie ervaringen, twee motoren.** De websitebouwer (`/bouwen`) blijft zoals hij is. Er komt één nieuwe kaartbouwer (`/kaart-maken`) met twee standen: Save the Date en trouwkaart. Beide delen stijl, template, namen, datum, locatie, boodschap en foto; de trouwkaart heeft daarbovenop gastengroep, uitnodigingstekst en tijden. Eén codebasis, voor de gebruiker twee losse ervaringen.
- **Anoniem ontwerpen.** Ontwerpen, de envelopsimulatie bekijken en een voorbeeld downloaden kan zonder account. Het ontwerp staat in de browser (localStorage). Het e-mailadres vragen we optioneel bij "Bewaar mijn ontwerp" en verplicht bij "Activeer", omdat we dan een factuur en een inlog nodig hebben.
- **Het event ontstaat pas bij bewaren of activeren**, niet bij het intypen van een mailadres. Het datamodel blijft: één event per bruidspaar waar kaart, betaling en later RSVP en site aan hangen. Dat is wat upgraden pijnloos maakt.
- **Alles wat de kaart verlaat vóór betaling draagt een watermerk**: het voorbeeld in de bouwer, de envelopsimulatie en de download.
- **Overtuigen zonder duwen.** Per stap één zin over het voordeel van digitaal, en één blok dat de complete trouwwebsite aanbiedt voor het verschil.

## De kaartbouwer

Links een kort stappenpad, rechts groot de kaart die live meebeweegt.

1. **Stijl**: de vijf thema's (roze, ivoor, zand, earthy, emerald).
2. **Template**: strak (huidig) en met foto; in stuk 2 komen sierlijk en bohemian erbij.
3. **Tekst**: namen, datum, locatie, boodschap. Trouwkaart: ook gastengroep, tijden en uitnodigingstekst.
4. **Foto**: alleen bij de fototemplate; lokaal verkleind, bij bewaren geüpload.
5. **Bekijken**: "Zo ontvangen je gasten hem" opent de envelopsimulatie met watermerk; "Download voorbeeld" geeft de afbeelding met watermerk.
6. **Activeren**: knop met de prijs. Niet ingelogd? Dan eerst e-mailadres, inloglink, en daarna gaat de bouwer verder waar je was.

## Techniek

- `app/kaart-maken/page.tsx`: client component. Ontwerp in localStorage onder `sayingyes_kaart`; de gewenste actie na inloggen onder `sayingyes_kaart_actie`.
- Ingelogd met `?event_id=`: laadt event en kaart van de server en bewerkt die (voor "Ontwerp aanpassen" vanuit het dashboard).
- Bewaren: `POST /api/drafts` (event met `plan`), `POST /api/cards`, `PATCH /api/cards/[id]`. Foto via `POST /api/cards/upload`.
- Nieuw: `GET /api/cards?event_id=` (eigenaar) en `POST /api/kaart-voorbeeld` (altijd met watermerk, licht gelimiteerd per IP).
- `CardReveal` krijgt `watermerk` (alleen de banen) naast `previewNotice` (strook plus banen), en `startOpen` voor het voorbeeld zonder envelop.
- Kaarttype naar pakket: Save the Date → `save_the_date`, trouwkaart → `uitnodiging`.

## Volgorde

1. **Klaar (10 sep 2026).** Kaartbouwer met tekstbewerking, simulatie, downloadvoorbeeld, bewaren en activeren, teksten en websiteblok. Links vanaf landingspagina, homepage, dashboard en de keuzepagina `/start`.
2. **Klaar (10 sep 2026).** Drie ontwerpen: strak (diamant, Cormorant), sierlijk (krul, Great Vibes, dubbele rand) en bohemian (takje, Marcellus, ronde hoeken). Recept staat in `CARD_DESIGN_STYLE` in `lib/cards.ts`; browser en afbeelding lezen daaruit. Een foto hoort nu bij elk ontwerp (`content.photoUrl`), het oude template `foto` telt als strak. Vereist `supabase/migration_card_designs.sql`.
3. **Klaar (10 sep 2026).** Kaartvoorbeeld en pakketstrook zijn uit `/bouwen` gehaald; een kaartpakket op die route stuurt door naar de kaartbouwer. `/aanmaken` maakt altijd een compleet event aan.

## Later

- Meer ontwerpen, en per ontwerp eventueel een eigen envelop.
- Upgrade-nudges vanuit de cron op basis van de trouwdatum.
