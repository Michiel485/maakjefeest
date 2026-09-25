# Illustraties voor de themakaarten (met AI)

Michiels keuze van 25 september 2026: de waterverfillustraties voor de botanische en seizoenskaarten maken we met AI. Claude kan in deze omgeving zelf geen afbeeldingen maken; Michiel maakt ze met een beeldgenerator en zet de bestanden in `public/kaart-illustraties/`. Daarna bouwt Claude de ontwerpen eromheen.

## Eisen aan elk bestand

- **PNG met een doorzichtige achtergrond.** Lukt dat niet in de generator, dan een effen witte achtergrond; die halen we er dan uit.
- **Groot genoeg:** minstens 2000 pixels aan de lange kant.
- **Alleen de illustratie:** geen tekst, geen letters, geen kader, geen papierstructuur.
- **Rechten:** gebruik een generator waarvan de voorwaarden commercieel gebruik toestaan (bijvoorbeeld een betaald abonnement op ChatGPT of Midjourney). Bewaar per bestand welke generator en welke prompt het was.
- **Stijl per thema gelijk houden:** maak de onderdelen van één thema in één sessie, met dezelfde stijlzin erin.

Stijlzin die in elke prompt komt:

> soft delicate watercolor illustration, hand-painted, muted natural colors, fine detail, elegant wedding stationery style, isolated on a transparent background, no text, no border

## Per thema

**Veldbloemen (zomer)**
1. `wildflower_border_bottom.png`: a wide border of wildflowers growing upward from the bottom edge (cosmos, cornflowers, poppies, grasses), roughly 3:1 wide.
2. `wildflower_corner.png`: a small cluster of wildflowers for a top corner, flowing diagonally.
3. `wildflower_frame.png`: a loose rectangular frame of small wildflowers with an empty centre, portrait 2:3.

**Winter**
1. `winter_pine_corner.png`: a pine branch with one pinecone for a card corner, diagonal.
2. `winter_wreath.png`: a round wreath of pine, holly, mistletoe and white berries, empty centre.
3. `winter_holly_sprig.png`: a small holly sprig with red berries.

**Herfst**
1. `autumn_border_top.png`: a lush border along the top edge with burnt orange roses, pinecones, dried leaves and red berries, roughly 3:1 wide.
2. `autumn_frame_oval.png`: an oval frame of burgundy peonies, dried flowers and oak leaves, empty oval centre, portrait 2:3.

**Romantisch (pastel)**
1. `pastel_flowers_top.png`: pale pink and white flowers hanging from the top edge, roughly 3:1 wide.
2. `pastel_flowers_bottom.png`: the same flowers growing from the bottom edge, as a mirror of the first.

## Wat er daarna gebeurt

Per thema bouwt Claude één of twee ontwerpen in de vorm van de voorbeelden die Michiel stuurde: bloemen onderaan met grote initialen, een kader met een venster, een krans met de titel erin, bloemen boven en onder met de namen in handschrift. De illustraties komen als afbeelding op de kaart, dus ze werken in de browser en in de download. In de galerij komen de filters Bloemen, Winter en Herfst erbij, en bij een trouwdatum in december of januari staat Winter vooraan.
