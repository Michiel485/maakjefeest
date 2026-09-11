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
2. **Klaar en live (11 sep 2026).** Drie ontwerpen: strak (diamant, Cormorant), sierlijk (krul, Great Vibes, dubbele rand) en bohemian (takje, Marcellus, ronde hoeken). Recept staat in `CARD_DESIGN_STYLE` in `lib/cards.ts`; browser en afbeelding lezen daaruit. Een foto hoort nu bij elk ontwerp (`content.photoUrl`), het oude template `foto` telt als strak. Migratie `supabase/migration_card_designs.sql` is gedraaid en geverifieerd.
3. **Klaar en live (11 sep 2026).** Kaartvoorbeeld en pakketstrook zijn uit `/bouwen` gehaald; een kaartpakket op die route stuurt door naar de kaartbouwer. `/aanmaken` maakt altijd een compleet event aan.

4. **Klaar (11 sep 2026).** De drie ontwerpen echt van elkaar los getrokken na de eerste testronde. De krul bij sierlijk was een fout: de tekening liep van x=6 tot x=126 in een vak van 160 breed, met het bolletje op 80, dus hij hing links en het bolletje lag naast het midden. Alle drie de ornamenten zijn nu precies symmetrisch rond x=80. Het takje bij bohemian is een echte tak met zes blaadjes geworden, zonder lijntjes eromheen. De afsluiter onderaan is bij alle drie een hartje maar in de stijl van het ontwerp (`slot`): vol bij strak, dun met twee zwaaitjes bij sierlijk, en vol met twee blaadjes aan de punt bij bohemian. Verder per ontwerp een eigen datumstijl (`datumStijl`) en bij sierlijk grotere namen. De keuzepagina `/start` staat nu in de donkere stijl van het prijsblok op de homepage, met de opsomming uit `PLANS`.

## De envelopanimatie (gebouwd 11 september 2026)

De eerste animatie (envelop zweeft, klep klapt om, kaart fade-int eroverheen) is vervangen door één betere animatie voor iedereen, plus één keuze die echt over smaak gaat.

- **Standaardgedrag, geen keuze:** het lakzegel kraakt en valt in twee helften weg, dan opent de klep, dan wordt de kaart uit de envelop getrokken en landt hij met een kleine veer. Dit is niet beter of slechter naar smaak, het is simpelweg beter, dus hier hoort geen knop bij.
- **Waarom dit niet met CSS-keyframes kan.** De eerste poging (11 sep 2026) ging te snel en het leek niet alsof de kaart uit de envelop kwam. Drie redenen, alle drie fout in de opzet en niet in de tijdsduur:
  1. De kaart stond absoluut gepositioneerd op de bovenrand van de wrapper, dus hij groeide naar beneden weg uit de bovenkant van de envelop. Nu staat de kaart altijd in de flow en ligt de envelop er absoluut over. Dat lost ook een sprong op: eerst verschoof de hele pagina op het moment dat de envelop verdween.
  2. De kaart was breder dan de envelop (420 tegen 340), dus je zag hem aan de zijkanten uitsteken. De envelop is nu `min(460px, 100vw - 12px)`, dus altijd breder dan de kaart.
  3. De envelop was één laag, dus de kaart lag erachter in plaats van erin. Nu bestaat de envelop uit drie lagen rond de kaart, met de vorm van een echte envelop:
     - **achterkant** (z-index 1): de hele rechthoek, dit zie je achter de kaart in de envelop.
     - **kaart** (2).
     - **klep** (4 als hij dicht is, 1 als hij opengaat): precies de driehoek die de voorkant openlaat. Dicht is hij de buitenkant van de envelop en ligt hij dus vóór de kaart; open klapt hij naar achteren en gaat de kaart er juist vóór langs. Die wissel is één z-index. Hij wordt ook donkerder bij het openen: je ziet dan de binnenkant, en dat maakt hem zichtbaar tegen een achtergrond met bijna dezelfde kleur.
     - **voorkant plus zegel** (5): de zijvouwen en de ondervouw als één geklipte vorm, `polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)`. Die dekt de kaart af behalve een V bovenin, en juist in die V zie je de kaart in de envelop liggen. De vorm sluit naadloos aan op de klep, dus dicht is de envelop dicht.
     De laag om die lagen heen mag geen `transform` en geen `z-index` hebben, want dat maakt een eigen stapelcontext en dan kan de kaart er niet meer tussen; het zweven gaat daarom via `top` en de drie lagen krijgen elk apart hun transform per frame.
     Let op de keerzijde van deze stapeling: de kaart ligt qua z-index bóven de envelopknop, dus zonder `pointer-events: none` op de kaart vangt die elke tik op en gaat de envelop niet open. Die staat aan zolang de kaart in de envelop zit en gaat eraf zodra de kaart open ligt, want dan zit er een link in.
- **Hoe het nu werkt.** De kaart ligt vanaf het begin in de envelop, met zijn bovenrand op 14 procent van de envelophoogte, dus zodra de klep opengaat zie je hem er al in liggen. De voorkant dekt hem daarna zelf af, dus de klip op de kaart hoeft alleen te verbergen wat ónder de envelop uitkomt. De kaart komt omhoog en de envelop zakt precies zo ver dat zijn bovenrand onder de onderkant van de kaart uitkomt; pas dan dekt hij niets meer af en is er nergens gesmokkeld. Dat rekenen gebeurt in een `requestAnimationFrame`-lus in `card-reveal.tsx`, niet in keyframes: de hoogtes zijn pas bij het openen bekend en moeten worden opgemeten.
- **Tijdlijn:** zegel kraakt en valt 0 tot 950 ms, klep opent 620 tot 1340 ms, kaart komt eruit 1280 tot 2780 ms.
- **Twee valkuilen bij het opmeten**, allebei zichtbaar als een sprongetje op het moment van de tik:
  1. `getBoundingClientRect()` geeft de positie ná de transform. Een tweede meting rekent de vorige verschuiving dus mee en zet de kaart steeds hoger. Daarom haalt `meet()` eerst alle eigen transforms weg en meet daarna; dat gebeurt binnen één taak, dus je ziet er niets van.
  2. De regel "Er is post voor je" stond als tweede item in dezelfde gecentreerde kolom als de envelop. Zodra die regel verdween schoof de envelop 22 pixels omlaag, precies op het moment dat de kaart moest gaan bewegen. Die regel staat nu absoluut onder de envelop, buiten de kolom.
- **Wel een keuze, want smaak:** Rustig (alleen het bovenstaande) of Feestelijk (plus gouden stofjes die eenmalig opdwarrelen).
- **Opslag:** `content.animatie` in de JSONB van de kaart, dus geen migratie. Leeg betekent Rustig, zodat bestaande kaarten niks merken. `cardAnimatie()` in `lib/cards.ts` normaliseert onbekende waarden.
- **De eerste animatie is bewaard en werkt nog:** `animatie: "klassiek"` in `CardAnimatie`. Die staat niet in `CARD_ANIMATIE_KEUZES`, dus het bruidspaar ziet hem niet, maar de code loopt er nog volledig door. Wil je hem ooit terug als keuze, dan is dat één regel in die lijst.
- Alles blijft achter `prefers-reduced-motion`: wie animaties uitzet krijgt meteen de open kaart.
- Overwogen en afgewezen: drie keuzes met de huidige animatie als "Standaard". Dat zou een knop zijn waarmee de klant zijn kaart minder mooi maakt.

## Later

- Meer ontwerpen, en per ontwerp eventueel een eigen envelop.
- Upgrade-nudges vanuit de cron op basis van de trouwdatum.
