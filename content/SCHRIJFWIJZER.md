# Schrijfwijzer tips-artikelen (sayingyes.nl/tips)

De map `content/tips/` bevat de artikelen van sayingyes.nl/tips als Markdown. Elk `.md`-bestand daar wordt automatisch een pagina op `/tips/<bestandsnaam>`; deze schrijfwijzer en `ONDERWERPEN.md` staan bewust één map hoger. Deze schrijfwijzer is de bron van waarheid voor iedereen (mens of AI) die een artikel toevoegt.

## Bestandsformaat

- Bestandsnaam = URL-slug: kleine letters, streepjes, geen accenten. Voorbeeld: `save-the-date-versturen-wanneer-en-hoe.md`.
- Frontmatter (verplicht):

```
---
title: "Titel met hoofdletter, maximaal ±65 tekens, met het belangrijkste zoekwoord"
date: "JJJJ-MM-DD"
description: "Meta-omschrijving van 140 tot 160 tekens die de lezer een reden geeft om te klikken."
slug: "zelfde-als-bestandsnaam"
---
```

- Optioneel `updated: "JJJJ-MM-DD"` bij een inhoudelijke herziening (wordt gebruikt voor sitemap en structured data).

## Stijl

- Nederlands, informeel maar verzorgd. Spreek de lezer aan met "je" en het bruidspaar met "jullie".
- **Nooit een kastlijntje (—) gebruiken.** Herformuleer met een komma, dubbele punt, punt of haakjes. En-dashes in bereiken (9–12 maanden) zijn wel toegestaan.
- Geen Engelse marketingtaal, geen uitroeptekens-overvloed, geen "in dit artikel gaan we...".
- Concreet en praktisch: cijfers, tijdlijnen, voorbeeldteksten, stappenplannen.

## Structuur

- Lengte: 700 tot 1000 woorden.
- Begin met een intro van 2 tot 4 zinnen die het probleem of de vraag van de lezer benoemt (geen H1: de titel uit de frontmatter is de H1).
- Gebruik `##` koppen (H2), 4 tot 8 stuks, bij voorkeur met het zoekwoord of een vraag als kop.
- Lijstjes met `-`, vetgedrukte kernwoorden aan het begin van een lijstitem waar dat helpt.
- Sluit af met `---` en een korte alinea over SayingYes met een link naar `/start` ("Start gratis, betalen doe je pas als je verstuurt of live zet").

## Interne links (verplicht, minimaal 3)

- `/start` (in de afsluiting; de keuzepagina tussen Save the Date, trouwkaart en website)
- Minimaal twee andere artikelen uit deze map, bijvoorbeeld:
  - `/tips/wat-zet-je-op-een-trouwwebsite`
  - `/tips/rsvp-trouwerij-hoe-pak-je-dat-aan`
  - `/tips/trouw-checklist`
  - `/tips/digitale-trouwkaart-vs-trouwwebsite`
  - `/tips/digitale-trouwkaart-versturen-whatsapp`
  - `/tips/save-the-date-versturen-wanneer-en-hoe`
  - `/tips/fotos-verzamelen-bruiloft-qr-code`
  - `/tips/besparen-op-je-bruiloft`
- Waar relevant: `/kaart-voorbeeld` (voorbeeld van een digitale trouwkaart).

## Feiten over SayingYes (alleen dit noemen, niets verzinnen)

- Ontwerpen is gratis; je betaalt pas als je verstuurt of live zet. Drie pakketten, als ladder: Save the Date (digitale kaart, €15), Trouwkaart (trouwkaarten per gastengroep met aanmelden en dashboard, inclusief de Save the Date, €25) en Trouwwebsite compleet (inclusief beide kaarten, €49,99). Prijzen en wat erbij zit staan in `lib/plans.ts`; die gaan voor. Upgraden kan altijd voor het verschil. De kaartpakketten hebben geen einddatum; de complete site staat een jaar online (en in elk geval tot een maand na de trouwdatum), daarna verlengen voor €22 per zes maanden. Geen abonnement.
- Zoekpagina's (sinds 2 oktober 2026), link in elk artikel naar de passende: `/digitale-trouwkaart` (trouwkaart, uitnodiging, aanmelden), `/save-the-date` (Save the Date) en `/trouwwebsite-maken` (website, fotomuur). `/digitale-uitnodiging` bestaat nog, maar de drie hierboven gaan voor.
- Het middelste pakket heet **Trouwkaart**, niet meer "uitnodiging" of "Uitnodiging & RSVP". Een trouwkaart per gastengroep kost dus €25; voor €15 is er alleen de Save the Date.
- Zeg nooit dat kaarten gratis zijn: ontwerpen is gratis, versturen kost geld. Bij de complete trouwwebsite zitten beide kaarten inbegrepen.
- De complete site is niet "eenmalig": €49,99 voor een jaar online.
- Eigen webadres: `jullienamen.sayingyes.nl`.
- Functies: RSVP met dieetwensen en dag-/avondgast, programma, informatie, cadeautips, fotogalerij, ons verhaal, ceremoniemeesters, wachtwoord of geheime vraag, zes talen (NL, EN, DE, FR, ES, IT), bouwen vanaf de telefoon.
- Unieke extra's: digitale Save the Date en trouwkaarten als WhatsApp-link met envelop-animatie (per gastengroep, met tijden en agendaknop), een gratis gastenlijst die zich vanzelf vult, en een live gastenfotomuur met QR-code, slideshow, moderatie, zip-download en collage.
- Gastenlijst: met één knop een herinnering naar wie nog niet reageerde. Save the Date: kijkteller (hoe vaak geopend) en gasten kunnen alvast ja of nee zeggen.
- Rekenvoorbeeld papier (uit `lib/papier.ts`, elk jaar op 1 januari nakijken): postzegel €1,40, bij 100 gasten ongeveer 60 huishoudens, dus €84 porto per ronde. Noem geen prijs voor drukwerk, daar zijn geen harde cijfers voor.
- Klantsites worden niet door Google geïndexeerd.
