// Hoe de namen op een kaart komen: op één regel als het past, anders een
// nette breuk voor het teken. Gedeeld door alle ontwerpen, in de browser en
// in de afbeelding die de server maakt.

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

// Hoeveel ruimer we de namen rekenen dan de tabel zegt. Bij twijfel liever de
// nette breuk dan namen die buiten het kader lopen.
const NAMEN_MARGE = 1.06
// Hoeveel kleiner de namen mogen worden om op één regel te passen
const NAMEN_KLEINSTE = 0.8

/**
 * Hoe de namen op de kaart komen. Eerst liepen ze gewoon terug als de regel
 * vol was, en dan bleef de & achter de eerste naam hangen: "Michiel &" en
 * daaronder "Lindsey" (Michiel, 26 september 2026). Nu:
 * 1. past het op één regel, dan één regel;
 * 2. past het met een iets kleinere letter (tot een vijfde kleiner), dan dat;
 * 3. anders een nette breuk vóór het teken: "Michiel" en "& Lindsey".
 * Een eigen enter wint altijd. Uitgerekend met de letterbreedtes in plaats
 * van gemeten, zodat de afbeelding van de server hetzelfde uitkomt.
 */
export function namenOpmaak(
  namen: string,
  letter: GemetenLetter,
  grootte: number,
  ruimte: number,
  opties: { letterafstand?: number; hoofdletters?: boolean } = {}
): { tekst: string; grootte: number; heel: boolean } {
  const meet = (tekst: string, g: number) =>
    tekstBreedte(opties.hoofdletters ? tekst.toUpperCase() : tekst, letter, g, opties.letterafstand ?? 0) * NAMEN_MARGE
  const afronden = (g: number) => Math.floor(g * 10) / 10
  if (/\n/.test(namen)) return { tekst: namen, grootte, heel: false }
  const enkel = namen.replace(/\s+/g, " ").trim()
  const breed = meet(enkel, grootte)
  if (breed <= ruimte) return { tekst: enkel, grootte, heel: true }
  if (breed * NAMEN_KLEINSTE <= ruimte) return { tekst: enkel, grootte: afronden((grootte * ruimte) / breed), heel: true }
  // Te lang voor één regel: breken vóór het teken, en is een van de twee
  // regels dan nog te breed, die regel passend maken
  const regels = namenRegels(enkel).split("\n")
  const breedste = Math.max(...regels.map((r) => meet(r, grootte)))
  if (breedste <= ruimte) return { tekst: regels.join("\n"), grootte, heel: true }
  const schaal = ruimte / breedste
  if (schaal >= 0.7) return { tekst: regels.join("\n"), grootte: afronden(grootte * schaal), heel: true }
  // Eén heel lange naam: kleiner, en verder mag hij teruglopen
  return { tekst: regels.join("\n"), grootte: afronden(grootte * 0.7), heel: false }
}
