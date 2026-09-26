// Hoe de namen op een kaart komen: op één regel als het past, anders een
// nette breuk voor het teken. Gedeeld door alle ontwerpen, in de browser en
// in de afbeelding die de server maakt.

import { CARD_DESIGN_STYLE, isKlassiekOntwerp, type CardDesign } from "./cards"
import { KADERS, ONTWERP_LETTERS } from "./kaart-ontwerpen"
import { tekstBreedte, type GemetenLetter } from "./letterbreedtes"

/**
 * Wat het bruidspaar kiest in de bouwer: de namen naast elkaar op één regel,
 * of onder elkaar (Michiel, 26 september 2026). Niets gekozen: de kaart
 * kiest zelf, zie namenOpmaak.
 */
export type NamenStand = "naast" | "onder"

export function namenStand(v: unknown): NamenStand | undefined {
  return v === "naast" || v === "onder" ? v : undefined
}

/**
 * De namen, als ze op één regel staan, netjes over twee regels: "Michiel" en
 * "& Lindsey". Heeft het bruidspaar zelf een enter gezet, dan wint die.
 */
export function namenRegels(namen: string): string {
  if (/\n/.test(namen)) return namen
  const m = namen.match(/^(.+?)\s+(&|\+|\||\/|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? `${m[1]}\n${m[2]} ${m[3]}` : namen
}

// Hoeveel ruimer we de namen rekenen dan de tabel zegt. Bij twijfel liever de
// nette breuk dan namen die buiten het kader lopen.
const NAMEN_MARGE = 1.06
// Hoeveel kleiner de namen vanzelf mogen worden om op één regel te passen
const NAMEN_KLEINSTE = 0.8
// Gekozen voor naast elkaar: zo veel kleiner als nodig, maar niet kleiner dan
// dit, anders worden lange namen onleesbaar
const NAMEN_NAAST_KLEINSTE = 0.5

/** Waar de namen op een ontwerp staan: in welke letter, hoe groot en hoe breed ze mogen, in pixels */
export interface NamenPlek {
  letter: GemetenLetter
  grootte: number
  ruimte: number
  letterafstand?: number
  hoofdletters?: boolean
}

/**
 * Hoe de namen op de kaart komen. Eerst liepen ze gewoon terug als de regel
 * vol was, en dan bleef de & achter de eerste naam hangen: "Michiel &" en
 * daaronder "Lindsey" (Michiel, 26 september 2026).
 *
 * Zonder keuze:
 * 1. past het op één regel, dan één regel;
 * 2. past het met een iets kleinere letter (tot een vijfde kleiner), dan dat;
 * 3. anders een nette breuk vóór het teken: "Michiel" en "& Lindsey".
 * Een eigen enter wint dan. Met een keuze gaat die voor.
 *
 * Uitgerekend met de letterbreedtes in plaats van gemeten, zodat de
 * afbeelding van de server hetzelfde uitkomt.
 */
export function namenOpmaak(
  namen: string,
  plek: NamenPlek,
  stand?: NamenStand | null
): { tekst: string; grootte: number; heel: boolean } {
  const { letter, grootte, ruimte } = plek
  const meet = (tekst: string, g: number) =>
    tekstBreedte(plek.hoofdletters ? tekst.toUpperCase() : tekst, letter, g, plek.letterafstand ?? 0) * NAMEN_MARGE
  const afronden = (g: number) => Math.floor(g * 10) / 10
  const enkel = namen.replace(/\s+/g, " ").trim()

  // Onder elkaar: breken vóór het teken (of waar het paar zelf een enter
  // zette), en is een regel dan nog te breed, die passend maken
  const onder = (tekst: string) => {
    const regels = tekst.split(/\r?\n/).map((r) => r.trim()).filter(Boolean)
    const breedste = Math.max(...regels.map((r) => meet(r, grootte)))
    if (breedste <= ruimte) return { tekst: regels.join("\n"), grootte, heel: true }
    const schaal = ruimte / breedste
    if (schaal >= 0.7) return { tekst: regels.join("\n"), grootte: afronden(grootte * schaal), heel: true }
    // Eén heel lange naam: kleiner, en verder mag hij teruglopen
    return { tekst: regels.join("\n"), grootte: afronden(grootte * 0.7), heel: false }
  }

  if (stand === "naast") {
    const breed = meet(enkel, grootte)
    if (breed <= ruimte) return { tekst: enkel, grootte, heel: true }
    const schaal = ruimte / breed
    if (schaal >= NAMEN_NAAST_KLEINSTE) return { tekst: enkel, grootte: afronden(grootte * schaal), heel: true }
    // Zelfs op de helft past het niet. Teruglopen brak dan midden in een naam
    // ("Annabelle-" en daaronder "Sophie"); de nette breuk staat beter.
    return onder(namenRegels(enkel))
  }
  if (stand === "onder") return onder(/\n/.test(namen) ? namen : namenRegels(enkel))

  if (/\n/.test(namen)) return { tekst: namen, grootte, heel: false }
  const breed = meet(enkel, grootte)
  if (breed <= ruimte) return { tekst: enkel, grootte, heel: true }
  if (breed * NAMEN_KLEINSTE <= ruimte) return { tekst: enkel, grootte: afronden((grootte * ruimte) / breed), heel: true }
  return onder(namenRegels(enkel))
}

/**
 * Waar de namen staan op elk ontwerp dat de keuze kent, voor een kaart van
 * deze breedte. Null bij ontwerpen die de namen bewust onder elkaar zetten
 * (Minimaal, de kransen, Palm) en bij een eigen ontwerp.
 *
 * De maten van de nieuwe ontwerpen gaan uit van een kaart van 400 breed,
 * zoals in KaartVoorkant. De eerste drie ontwerpen rekenen in echte pixels,
 * want hun letter schaalt niet mee met de kaart.
 */
export function namenPlek(ontwerp: CardDesign, opties: { breedte: number; datumIso?: string | null }): NamenPlek | null {
  const { breedte } = opties
  if (isKlassiekOntwerp(ontwerp)) {
    const ds = CARD_DESIGN_STYLE[ontwerp]
    return {
      letter: { google: ds.namenFontImage.family, gewicht: ds.namenFontImage.weight },
      grootte: 2.4 * ds.namenSchaal * 16,
      // De kaart min de rand, de binnenrand (px-8) en bij Sierlijk het tweede lijntje
      ruimte: breedte - 4 - 64 - (ds.dubbeleRand ? 22 : 0),
      letterafstand: ds.namenSpatiering ? parseFloat(ds.namenSpatiering) : 0,
    }
  }
  const s = breedte / 400
  const letters = ONTWERP_LETTERS[ontwerp]
  const maat = (grootte: number, ruimte: number, extra: Partial<NamenPlek> = {}): NamenPlek => ({
    letter: letters.namen,
    grootte: grootte * s,
    ruimte: ruimte * s,
    ...extra,
  })
  switch (ontwerp) {
    case "fotovol":
      return maat(48, 336)
    case "boog":
      return maat(31, 340)
    // Het gouden kader is 82 procent van de kaart, min de binnenrand
    case "olijf":
      return maat(40, 400 * 0.82 - 80)
    // De namen in de lopende letter, met ruimte tussen de letters
    case "titel":
      return maat(14, 334 - 48, { letter: letters.tekst, letterafstand: 0.16 })
    case "ibiza":
      return maat(46, 344)
    // Klein, in hoofdletters en met veel ruimte ertussen
    case "fotoschrift":
      return maat(11, 400 - 52, { letter: letters.tekst, letterafstand: 0.3, hoofdletters: true })
    case "datum":
      return maat(opties.datumIso ? 36 : 52, 400 - 72)
  }
  const kader = KADERS[ontwerp]
  if (kader?.vorm === "liggend") return maat(34, 400 * kader.ruimte[0])
  return null
}

/** Wat de kaart zelf zou kiezen, voor de bouwer: dat staat daar geselecteerd */
export function namenStandVanzelf(namen: string, plek: NamenPlek): NamenStand {
  return namenOpmaak(namen, plek).tekst.includes("\n") ? "onder" : "naast"
}
