// De lettertypes van de nieuwe kaartontwerpen, voor de browser en voor de
// afbeelding. Zie docs/PLAN-kaartontwerpen.md.
//
// In de browser komen ze uit next/font (app/layout.tsx), als CSS-variabele.
// In de afbeelding (satori) haalt lib/card-image-nieuw.tsx ze bij Google
// Fonts, met alleen de tekens die op de kaart staan.

import type { CardDesign, NieuwOntwerp } from "./cards"

export interface KaartLetter {
  /** Voor de browser */
  css: string
  /** De naam bij Google Fonts, voor de afbeelding */
  google: string
  gewicht: 300 | 400 | 500 | 600
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
  // Voor de themakaarten
  allison: { css: "var(--font-allison), cursive", google: "Allison", gewicht: 400 },
  abril: { css: "var(--font-abril), Georgia, serif", google: "Abril Fatface", gewicht: 400 },
  jostDun: { css: "var(--font-jost), Helvetica, sans-serif", google: "Jost", gewicht: 300 },
  jost: { css: "var(--font-jost), Helvetica, sans-serif", google: "Jost", gewicht: 400 },
} satisfies Record<string, KaartLetter>

/**
 * De rollen op een kaart: namen, kleine koppen en lopende tekst, en een extra
 * letter voor wat eruit moet springen, zoals het "en" tussen de namen of een
 * titel in handschrift.
 */
export interface OntwerpLetters {
  namen: KaartLetter
  kop: KaartLetter
  tekst: KaartLetter
  extra?: KaartLetter
}

export const ONTWERP_LETTERS: Record<NieuwOntwerp, OntwerpLetters> = {
  minimaal: { namen: L.italiana, kop: L.montserrat, tekst: L.montserrat },
  fotovol: { namen: L.pinyon, kop: L.montserrat, tekst: L.montserrat },
  boog: { namen: L.prata, kop: L.cormorant, tekst: L.montserrat },
  deco: { namen: L.cinzel, kop: L.cinzel, tekst: L.montserrat },
  datum: { namen: L.allura, kop: L.bodoni, tekst: L.montserrat },
  // Een eigen ontwerp is een afbeelding; alleen de lege plek heeft tekst
  eigen: { namen: L.montserrat, kop: L.montserrat, tekst: L.montserrat },
  titel: { namen: L.jost, kop: L.abril, tekst: L.jost, extra: L.abril },
  palm: { namen: L.jostDun, kop: L.jost, tekst: L.jost, extra: L.allison },
  ibiza: { namen: L.allison, kop: L.jost, tekst: L.jost, extra: L.allison },
  fotoschrift: { namen: L.jost, kop: L.allison, tekst: L.jost, extra: L.allison },
  olijf: { namen: L.pinyon, kop: L.jost, tekst: L.jost, extra: L.pinyon },
}

// Ontwerpen die niet staand maar vierkant zijn: hoogte gedeeld door breedte
export const ONTWERP_VERHOUDING: Partial<Record<NieuwOntwerp, number>> = {
  olijf: 1,
}

/**
 * Waar een illustratie vandaan komt. In de browser een gewoon pad; de
 * afbeelding (satori) haalt hem op via de volledige link. Lokaal is dat de
 * ontwikkelserver, anders de echte site.
 */
export function illustratie(pad: string, voorAfbeelding: boolean): string {
  if (!voorAfbeelding) return pad
  const basis =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_BASE_URL || "https://www.sayingyes.nl"
  return `${basis.replace(/\/$/, "")}${pad}`
}

/** Dezelfde rollen, als font-family voor in een style. */
export interface VoorkantLetters {
  namen: string
  kop: string
  tekst: string
  extra: string
}

export function browserLetters(ontwerp: NieuwOntwerp): VoorkantLetters {
  const l = ONTWERP_LETTERS[ontwerp]
  return { namen: l.namen.css, kop: l.kop.css, tekst: l.tekst.css, extra: (l.extra ?? l.namen).css }
}

// ── Wat onder de kaart komt ─────────────────────────────────────────────────
// Een strakke kaart heeft weinig tekst: namen, datum en een titel. Wat er
// niet op past komt onder de kaart op de pagina, zodat er niets verloren gaat
// (Michiel, 25 september 2026). De boodschap alleen als het bruidspaar hem
// zelf schreef; onze standaardtekst hoort bij de kaarten waar hij op staat.
export interface OnderDeKaart {
  locatie: boolean
  bericht: boolean
  details: boolean
}

export const ONDER_DE_KAART: Partial<Record<CardDesign, OnderDeKaart>> = {
  // De locatie past wel op de kaart (Michiel, 25 september 2026)
  titel: { locatie: false, bericht: true, details: true },
  palm: { locatie: true, bericht: false, details: true },
  ibiza: { locatie: true, bericht: true, details: true },
  fotoschrift: { locatie: true, bericht: true, details: true },
  olijf: { locatie: false, bericht: true, details: true },
  // Een eigen ontwerp heeft alles al in de afbeelding; alleen wat je er zelf
  // bij schrijft komt eronder
  eigen: { locatie: false, bericht: true, details: false },
}
