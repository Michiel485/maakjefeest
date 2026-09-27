// Hoe de namen op een kaart komen: op één regel als het past, anders een
// nette breuk voor het teken. Gedeeld door alle ontwerpen, in de browser en
// in de afbeelding die de server maakt.

import { CARD_DESIGN_STYLE, isKlassiekOntwerp, type CardDesign } from "./cards"
import { KADERS, ONTWERP_LETTERS } from "./kaart-ontwerpen"
import { tekstBreedte, type GemetenLetter } from "./letterbreedtes"

/**
 * De namen, als ze op één regel staan, netjes over twee regels: "Michiel" en
 * "& Lindsey". Heeft het bruidspaar zelf een enter gezet, dan wint die.
 */
export function namenRegels(namen: string): string {
  if (/\n/.test(namen)) return namen
  const m = namen.match(/^(.+?)\s+(&|\+|\||\/|en|and|et|und|y|e)\s+(.+)$/i)
  return m ? `${m[1]}\n${m[2]} ${m[3]}` : namen
}

// Hoeveel ruimer we de namen rekenen dan de tabel zegt. Bij twijfel liever
// iets kleiner dan namen die buiten het kader lopen.
const NAMEN_MARGE = 1.06
// Zo veel kleiner mogen de namen worden om te passen; daaronder worden lange
// namen onleesbaar
const NAMEN_KLEINSTE = 0.5

/** Waar de namen op een ontwerp staan: in welke letter, hoe groot en hoe breed ze mogen, in pixels */
export interface NamenPlek {
  letter: GemetenLetter
  grootte: number
  ruimte: number
  letterafstand?: number
  hoofdletters?: boolean
}

/**
 * Hoe de namen op de kaart komen: zoals het bruidspaar ze typt. Op één regel
 * getypt is één regel, met een enter ertussen onder elkaar. Geen knop
 * (Michiel, 27 september 2026). Eerst liepen ze vanzelf terug als de regel
 * vol was, en dan bleef de & achter de eerste naam hangen.
 *
 * Past een regel niet, dan wordt de letter kleiner, tot de helft. Past één
 * regel ook dan niet, dan komt er een nette breuk vóór het teken: "Michiel"
 * en "& Lindsey".
 *
 * Met vrijeSchaal (de homepagina): eerst passend, en dan die schaal eroverheen.
 * Dan is 100% "past precies in het ontwerp" en werkt de schuif vanaf daar;
 * eerst werd alles weer teruggeschaald naar passend en gebeurde er tussen 70
 * en 140% niets. Nooit breder dan max.
 *
 * Uitgerekend met de letterbreedtes in plaats van gemeten, zodat de
 * afbeelding van de server hetzelfde uitkomt.
 */
export function namenOpmaak(
  namen: string,
  plek: NamenPlek,
  opties: { vrijeSchaal?: number; max?: number } = {}
): { tekst: string; grootte: number; heel: boolean } {
  const { letter, grootte, ruimte } = plek
  const meet = (tekst: string, g: number) =>
    tekstBreedte(plek.hoofdletters ? tekst.toUpperCase() : tekst, letter, g, plek.letterafstand ?? 0) * NAMEN_MARGE
  const afronden = (g: number) => Math.floor(g * 10) / 10

  const passend = (regels: string[]) => {
    const breedste = Math.max(...regels.map((r) => meet(r, grootte)))
    const schaal = Math.min(1, ruimte / breedste)
    return { breedste, schaal }
  }
  let regels = namen.split(/\r?\n/).map((r) => r.replace(/\s+/g, " ").trim()).filter(Boolean)
  if (!regels.length) regels = [namen.trim()]
  let { breedste, schaal } = passend(regels)
  // Eén regel die ook op de helft niet past: de nette breuk
  if (regels.length === 1 && schaal < NAMEN_KLEINSTE) {
    const gebroken = namenRegels(regels[0]).split("\n")
    if (gebroken.length > 1) {
      regels = gebroken
      ;({ breedste, schaal } = passend(regels))
    }
  }
  const heel = schaal >= NAMEN_KLEINSTE
  let g = grootte * Math.max(schaal, NAMEN_KLEINSTE)
  if (opties.vrijeSchaal != null) {
    g *= opties.vrijeSchaal
    // Wel nooit breder dan het ontwerp zelf
    if (opties.max) g = Math.min(g, (grootte * opties.max) / breedste)
  }
  return { tekst: regels.join("\n"), grootte: afronden(g), heel }
}

/**
 * Waar de namen staan op elk ontwerp dat de keuze kent, voor een kaart van
 * deze breedte. Null bij Palm (die zet de namen altijd onder elkaar, met het
 * woord ertussen in handschrift) en bij een eigen ontwerp.
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
    case "minimaal":
      return maat(52, 400 - 80)
    // De ontwerpen van de homepagina
    case "editoriaal":
      return maat(64, 400 - 40)
    case "monogram":
      return maat(32, 400 - 48)
    case "lijnkader":
      return maat(40, 400 - 120)
    case "datumband":
      return maat(52, 400 - 48)
    // De themaontwerpen
    case "winter":
      return maat(40, 400 - 80)
    case "zomer":
      return maat(34, 400 - 70)
    case "liefde":
      return maat(38, 400 - 70)
    case "boho":
      return maat(38, 400 - 70)
    case "hartlijn":
      return maat(48, 400 - 70)
    case "tweeharten":
      return maat(40, 400 - 80)
    case "hartamp":
      return maat(44, 400 - 70)
    // Binnen in het hart is minder ruimte
    case "hartkader":
      return maat(38, 210)
    case "krijthart":
      return maat(48, 400 - 70)
    case "kalligrafie":
      return maat(42, 400 - 70)
    case "schaduwhart":
      return maat(40, 400 - 70)
    // Art deco: in hoofdletters, met ruimte tussen de letters
    case "deco":
      return maat(29, 400 - 88, { letterafstand: 0.1, hoofdletters: true })
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
  // De kransen: in de witte vorm, die 372 breed is op een kaart van 400
  // (Michiel, 27 september 2026: naast elkaar moest ook kunnen)
  if (kader?.vorm === "krans") {
    return maat(ontwerp === "herfst" || ontwerp === "herfstruit" ? 21 : 30, 372 * kader.ruimte[0])
  }
  return null
}
