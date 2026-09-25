# Plan: meer en echt andere kaartontwerpen

Besloten op 25 september 2026. De kaarten waren één kaart in vijftien jasjes: drie ontwerpen (Strak, Sierlijk, Bohemian) met dezelfde opbouw, en vijf kleurthema's van de website. Wie een heel ander soort kaart zoekt, vond die niet. Michiel koos voor drie sporen tegelijk: echt andere ontwerpen (A), een envelop die meevariëert (B) en je eigen ontwerp uploaden (C).

## Het herstelpunt

- **Git-tag `stabiel-2026-09-25`** op commit `b7292c8`: alles werkt, kaartbouwer en websitebouwer met panelen op de telefoon. Terug naar dit punt kan altijd.
- **Snel terug zonder te bouwen:** in Vercel, Deployments, de productie-deployment van `b7292c8` (`sayingyes-rlm3wvn8w-michiel485s-projects.vercel.app`) en dan "Promote to Production". Dat duurt seconden. Voorwaarde: de Deployment Retention in de Vercel-instellingen gooit productie-deployments niet weg.
- **Bouwen op een aparte branch `kaartontwerpen`.** Elke push geeft een eigen voorbeeldadres van Vercel; `main` en sayingyes.nl blijven ongemoeid tot Michiel akkoord geeft. Let op: dat voorbeeldadres gebruikt dezelfde database en dezelfde Mollie-sleutel als de echte site. Ontwerpen kan er zonder inloggen; betalen daar is echt betalen.
- **Terugdraaien breekt niets.** Alles wat nieuw is staat in `cards.content` (JSON) of is een nieuwe waarde voor `cards.template`. Oude code kent een nieuwe templatewaarde niet en valt terug op Strak (`cardDesign()`), en negeert velden die hij niet kent. De enige migratie verruimt de toegestane templatewaarden; die mag blijven staan.

## De bouwstenen

### Eén renderer voor browser en afbeelding

De bestaande drie ontwerpen blijven precies zoals ze zijn: hun code wordt niet aangeraakt. De nieuwe ontwerpen krijgen één component, `KaartVoorkant`, dat zowel in de browser (de kaartpagina en het voorbeeld in de bouwer) als in de afbeelding (download en WhatsApp-voorvertoning, via satori) werkt. Daarom alleen wat satori kan: inline styles, flex, absolute posities, randen, afrondingen, verlopen, inline SVG en afbeeldingen. Geen clip-path, geen filters, geen Tailwind-klassen. Een maat `s` schaalt alles mee, zodat het in 420 pixels breed en in 1080 pixels breed hetzelfde is.

### Een register van ontwerpen

`lib/kaart-ontwerpen.ts`: per ontwerp de naam, een korte uitleg, de sfeer (klassiek, modern, romantisch, natuurlijk, feestelijk), de lettertypes, de eigen kleurpaletten en of er een foto bij hoort. De bouwer, de kaartpagina en de afbeelding lezen allemaal hieruit.

### Kleur los van de website, maar standaard gelijk

Nu is de kleur van de kaart de stijl van de bruiloft: verander je hem in de kaartbouwer, dan verandert de website mee. Nieuw: `content.kleur`. Leeg of `"website"` betekent zoals nu, dezelfde kleuren als de website. Een ontwerp als Art deco heeft ook eigen paletten, bijvoorbeeld zwart met goud en groen met goud. Kaart en website die bij elkaar passen blijft de standaard, want dat is een sterk punt.

### Een galerij in de bouwer

Bij acht ontwerpen werkt een rijtje knopjes niet meer. Het onderdeel Ontwerp wordt een galerij met echte miniaturen van jullie eigen kaart: jullie namen en datum in elk ontwerp. Gegroepeerd op sfeer, met een filter. Op de telefoon twee naast elkaar, op de laptop in de zijbalk.

## Fase 1: het fundament en de galerij

- `KaartVoorkant`, het register en `content.kleur`
- De galerij in de bouwer, met de drie bestaande ontwerpen erin
- De afbeeldingsroute leest nieuwe ontwerpen via `KaartVoorkant`, oude via de bestaande code
- Migratie: templatewaarden verruimen (voluit in de chat)

## Fase 2: vier nieuwe ontwerpen

Allemaal zelf te tekenen, zonder ingekocht beeldmateriaal:

- **Minimaal**: veel wit, grote letters, bijna geen versiering. Modern.
- **Foto**: de foto vult de hele kaart, de tekst staat erop op een zachte laag. Zonder foto een volle kleur.
- **Boog**: een boogvenster bovenin met de foto of een kleur erin, de tekst eronder. Romantisch.
- **Art deco**: geometrische gouden lijnen en hoeken, strakke letters, eigen donkere paletten. Feestelijk.

Mogelijk een vijfde: **Datum**, met de datum groot als beeld ("15 · 08 · 27").

Elk ontwerp wordt getest in zes talen (Duitse zinnen zijn lang), met en zonder foto, als Save the Date en als trouwkaart met gastengroep en details, op de telefoon, en als download.

## Fase 3: de envelop

**Teruggedraaid op 25 september 2026.** Michiel vond de keuzes te veel en het oogde goedkoop. De envelop volgt weer automatisch de stijl van de kaart; alleen Minimaal (zegel in de kleur van de namen) en Art deco (een fijne waaier aan de binnenkant van de klep) hebben iets eigens. Geen keuzes in de bouwer. Wat hieronder staat was het oorspronkelijke plan.

- **Kleur** van de envelop: volgt de kaart, of een eigen keuze (crème, kraft, zwart, salie, oudroze)
- **Voering**, te zien als de klep opengaat: effen, streepjes, stippen, takjes, art deco, marmer
- **Zegel**: kleur (goud, bordeaux, groen, zwart, wit) en de initialen of een hartje

Opgeslagen in `content.envelop`. In de bouwer onder Uiterlijk, met een voorbeeld van de dichte envelop. Werkt voor elk ontwerp, ook de drie bestaande.

## Fase 4: je eigen ontwerp

- Nieuw ontwerp **Eigen ontwerp** (`template = "eigen"`): upload een afbeelding (JPG of PNG, tot 8 MB, staand, aanbevolen minstens 1000 pixels breed). Die afbeelding is de kaart.
- Wij doen de rest: de envelop, het aanmelden, de agenda, de gastenlijst en de link.
- De namen en de datum blijven nodig, voor het zegel, de voorvertoning in WhatsApp, de agenda en het formulier. Ze komen alleen niet op de kaart.
- Zolang het niet is afgenomen staat het watermerk erover, net als bij elke kaart. Anders is het een gratis manier om een eigen kaart te versturen.
- Een vinkje bij het uploaden: "Wij mogen dit ontwerp gebruiken", want wie een ontwerp van een ander uploadt, maakt ons medeplichtig.
- Zelfde prijs als een gewone kaart.

## Themakaarten (25 september 2026)

Na Michiels voorbeelden: kaarten met minder tekst, een vaste titel en namen met een verbindingswoord in een andere letter. Gebouwd, zonder ingekocht beeldmateriaal: **Grote titel** (Save the Date als beeld in een ovaal), **Palm** (namen dun, "en" in handschrift, kop in een boog), **Ibiza** (palmen en golven in een ovaal, tekst rond het ovaal) en **Foto met handschrift**. Wat een strak ontwerp niet op de kaart zet (locatie, een eigen tekst, de details) staat onder de kaart op de pagina (`ONDER_DE_KAART` in lib/kaart-ontwerpen.ts). Nieuwe lettertypes: Allison, Abril Fatface en Jost. Een nieuw palet Blush. De **vouwkaart** is een keuze bij Openen en werkt met elk ontwerp: eerst een kaft, tik en hij klapt open; wie bewegingen heeft uitgezet ziet meteen de binnenkant. Filters boven de galerij. Herstelpunt: git-tag `stabiel-2026-09-25b`.

## Fase 5: botanisch, met beeldmateriaal

Michiel koos op 25 september 2026 voor AI-illustraties; zie docs/PROMPTS-illustraties.md.

Waterverf met bloemen en bladeren kan ik niet tekenen. Dat komt pas als er beeldmateriaal is met een licentie voor commercieel gebruik, van Michiel of ingekocht. Voorbeeldkaarten die Michiel mooi vindt helpen bij alle ontwerpen: als inspiratie, nooit om één op één na te maken.

## Klaar als

- Alle nieuwe ontwerpen werken op de kaartpagina, in de bouwer en in de afbeelding
- De bestaande kaarten zien er precies hetzelfde uit als op `stabiel-2026-09-25`
- Michiel heeft het op het voorbeeldadres gezien en akkoord gegeven, en pas dan gaat `kaartontwerpen` naar `main`
