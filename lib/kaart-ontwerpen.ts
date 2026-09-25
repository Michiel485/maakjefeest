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
  pampas: { namen: L.pinyon, kop: L.jost, tekst: L.jost },
  pampasruit: { namen: L.pinyon, kop: L.jost, tekst: L.jost },
  terra: { namen: L.allison, kop: L.jost, tekst: L.jost },
  terraruit: { namen: L.allison, kop: L.jost, tekst: L.jost },
  herfst: { namen: L.prata, kop: L.jost, tekst: L.jost },
  herfstruit: { namen: L.prata, kop: L.jost, tekst: L.jost },
  goudblad: { namen: L.allison, kop: L.jost, tekst: L.jost },
  magnolia: { namen: L.pinyon, kop: L.jost, tekst: L.jost },
}

// ── De kaders uit de websitebouwer ─────────────────────────────────────────
// Michiels wens van 25 september 2026: de kaders die de websitebouwer al
// heeft, ook als kaartontwerp. De browser gebruikt dezelfde bestanden als de
// website; de afbeelding (satori) een PNG of JPG, want WebP kan die niet lezen.
// Midden en ruimte: waar de tekst komt, als deel van de breedte en de hoogte
// van de tekening. Opgemeten aan de witte vorm in elk kader.
export interface KaderOntwerp {
  web: string
  afbeelding: string
  vorm: "krans" | "liggend"
  midden: [number, number]
  ruimte: [number, number]
  /** Alleen bij een liggende kaart: hoogte gedeeld door breedte */
  verhouding?: number
  /** De kleuren horen bij de tekening */
  kleur: { namen: string; accent: string }
}

export const KADERS: Partial<Record<NieuwOntwerp, KaderOntwerp>> = {
  pampas: { web: "/frames/gold-circle.webp", afbeelding: "/kaart-illustraties/pampas.png", vorm: "krans", midden: [0.506, 0.491], ruimte: [0.4, 0.36], kleur: { namen: "#5E5040", accent: "#A8844C" } },
  pampasruit: { web: "/frames/gold-diamond.webp", afbeelding: "/kaart-illustraties/pampas-ruit.png", vorm: "krans", midden: [0.5, 0.5], ruimte: [0.4, 0.3], kleur: { namen: "#5E5040", accent: "#A8844C" } },
  terra: { web: "/frames/terra-circle.webp", afbeelding: "/kaart-illustraties/terracotta.png", vorm: "krans", midden: [0.5, 0.5], ruimte: [0.37, 0.34], kleur: { namen: "#6B4234", accent: "#B0603F" } },
  terraruit: { web: "/frames/terra-diamond.webp", afbeelding: "/kaart-illustraties/terracotta-ruit.png", vorm: "krans", midden: [0.5, 0.5], ruimte: [0.4, 0.3], kleur: { namen: "#6B4234", accent: "#B0603F" } },
  herfst: { web: "/frames/earthy-circle.webp", afbeelding: "/kaart-illustraties/herfst.png", vorm: "krans", midden: [0.506, 0.492], ruimte: [0.4, 0.36], kleur: { namen: "#5A463C", accent: "#94574A" } },
  herfstruit: { web: "/frames/earthy-diamond.webp", afbeelding: "/kaart-illustraties/herfst-ruit.png", vorm: "krans", midden: [0.5025, 0.486], ruimte: [0.37, 0.28], kleur: { namen: "#5A463C", accent: "#94574A" } },
  goudblad: { web: "/frames/Bloem2-breed.webp", afbeelding: "/kaart-illustraties/gouden-blad.jpg", vorm: "liggend", verhouding: 0.666, midden: [0.5, 0.5], ruimte: [0.56, 0.64], kleur: { namen: "#7A5A45", accent: "#B98B5E" } },
  magnolia: { web: "/frames/Bloem-rechthoek.webp", afbeelding: "/kaart-illustraties/magnolia.jpg", vorm: "liggend", verhouding: 0.56, midden: [0.5, 0.5], ruimte: [0.58, 0.66], kleur: { namen: "#44503F", accent: "#A08249" } },
}

// Ontwerpen die niet staand maar vierkant zijn: hoogte gedeeld door breedte
export const ONTWERP_VERHOUDING: Partial<Record<NieuwOntwerp, number>> = {
  olijf: 1,
  goudblad: 0.666,
  magnolia: 0.56,
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
  // De kransen hebben onder de krans plek voor de locatie en de boodschap
  pampas: { locatie: false, bericht: false, details: true },
  pampasruit: { locatie: false, bericht: false, details: true },
  terra: { locatie: false, bericht: false, details: true },
  terraruit: { locatie: false, bericht: false, details: true },
  herfst: { locatie: false, bericht: false, details: true },
  herfstruit: { locatie: false, bericht: false, details: true },
  goudblad: { locatie: false, bericht: true, details: true },
  magnolia: { locatie: false, bericht: true, details: true },
  // Een eigen ontwerp heeft alles al in de afbeelding; alleen wat je er zelf
  // bij schrijft komt eronder
  eigen: { locatie: false, bericht: true, details: true },
}
