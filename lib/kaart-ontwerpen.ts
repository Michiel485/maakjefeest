// De lettertypes van de nieuwe kaartontwerpen, voor de browser en voor de
// afbeelding. Zie docs/PLAN-kaartontwerpen.md.
//
// In de browser komen ze uit next/font (app/layout.tsx), als CSS-variabele.
// In de afbeelding (satori) haalt lib/card-image-nieuw.tsx ze bij Google
// Fonts, met alleen de tekens die op de kaart staan.

import type { NieuwOntwerp } from "./cards"

export interface KaartLetter {
  /** Voor de browser */
  css: string
  /** De naam bij Google Fonts, voor de afbeelding */
  google: string
  gewicht: 400 | 500 | 600
}

const L = {
  montserrat: { css: "var(--font-montserrat), Helvetica, sans-serif", google: "Montserrat", gewicht: 500 },
  italiana: { css: "var(--font-italiana), Georgia, serif", google: "Italiana", gewicht: 400 },
  bodoni: { css: "var(--font-bodonimoda), Georgia, serif", google: "Bodoni Moda", gewicht: 400 },
  cinzel: { css: "var(--font-cinzel), Georgia, serif", google: "Cinzel", gewicht: 400 },
  pinyon: { css: "var(--font-pinyonscript), cursive", google: "Pinyon Script", gewicht: 400 },
  allura: { css: "var(--font-allura), cursive", google: "Allura", gewicht: 400 },
  prata: { css: "var(--font-prata), Georgia, serif", google: "Prata", gewicht: 400 },
  cormorant: { css: "var(--font-cormorant), Georgia, serif", google: "Cormorant Garamond", gewicht: 600 },
} satisfies Record<string, KaartLetter>

/** De rollen op een kaart: namen, kleine koppen en lopende tekst. */
export interface OntwerpLetters {
  namen: KaartLetter
  kop: KaartLetter
  tekst: KaartLetter
}

export const ONTWERP_LETTERS: Record<NieuwOntwerp, OntwerpLetters> = {
  minimaal: { namen: L.italiana, kop: L.montserrat, tekst: L.montserrat },
  fotovol: { namen: L.pinyon, kop: L.montserrat, tekst: L.montserrat },
  boog: { namen: L.prata, kop: L.cormorant, tekst: L.montserrat },
  deco: { namen: L.cinzel, kop: L.cinzel, tekst: L.montserrat },
  datum: { namen: L.allura, kop: L.bodoni, tekst: L.montserrat },
  // Een eigen ontwerp is een afbeelding; alleen de lege plek heeft tekst
  eigen: { namen: L.montserrat, kop: L.montserrat, tekst: L.montserrat },
}

/** Dezelfde rollen, als font-family voor in een style. */
export interface VoorkantLetters {
  namen: string
  kop: string
  tekst: string
}

export function browserLetters(ontwerp: NieuwOntwerp): VoorkantLetters {
  const l = ONTWERP_LETTERS[ontwerp]
  return { namen: l.namen.css, kop: l.kop.css, tekst: l.tekst.css }
}
