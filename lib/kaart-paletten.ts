// Kleuren voor een kaart, los van de website.
//
// Tot 25 september 2026 was de kleur van een kaart altijd de stijl van de
// bruiloft: veranderde je hem in de kaartbouwer, dan veranderde de website
// mee. Dat blijft de standaard, want kaart en website die bij elkaar passen is
// een sterk punt. Maar een ontwerp als Art deco wil zwart met goud, en dat
// hoeft de website niet te worden. Dus kan een kaart nu ook een eigen palet
// hebben (content.kleur). Zie docs/PLAN-kaartontwerpen.md.
//
// Een palet overschrijft alleen de kleuren van de stijlconfiguratie. De
// lettertypes en de rest blijven van de website, zodat de envelop, het
// formulier en de knoppen onder de kaart vanzelf meekleuren.

import type { SC } from "./event-styles"

export interface KaartPalet {
  id: string
  naam: string
  /** De achtergrond van de pagina om de kaart heen */
  pagina: string
  /** De kaart zelf */
  kaart: string
  /** Namen en koppen */
  kop: string
  /** Lopende tekst */
  tekst: string
  /** Lijntjes, ornamenten, datum en knoppen */
  accent: string
  /** De kleine kop bovenaan de kaart */
  label: string
  /** Tekst op een knop in de accentkleur */
  knopTekst: string
  /** Donker palet: tekst op de pagina moet dan licht zijn */
  donker?: boolean
}

export const KAART_PALETTEN: KaartPalet[] = [
  {
    id: "zwartgoud",
    naam: "Zwart en goud",
    pagina: "#1E1C19",
    kaart: "#121110",
    kop: "#F3EBDD",
    tekst: "#DCD2C1",
    accent: "#C9A45C",
    label: "#C9A45C",
    knopTekst: "#121110",
    donker: true,
  },
  {
    id: "nachtblauw",
    naam: "Nachtblauw",
    pagina: "#1C2433",
    kaart: "#141B29",
    kop: "#F1EADB",
    tekst: "#D6D0C3",
    accent: "#CDAE6A",
    label: "#CDAE6A",
    knopTekst: "#141B29",
    donker: true,
  },
  {
    id: "zwartwit",
    naam: "Zwart op wit",
    pagina: "#ECEBE8",
    kaart: "#FFFFFF",
    kop: "#141414",
    tekst: "#3A3A3A",
    accent: "#141414",
    label: "#6E6E6E",
    knopTekst: "#FFFFFF",
  },
  {
    id: "salie",
    naam: "Salie",
    pagina: "#E9ECE4",
    kaart: "#F7F8F3",
    kop: "#34402F",
    tekst: "#4E5A48",
    accent: "#7D8E72",
    label: "#7D8E72",
    knopTekst: "#FFFFFF",
  },
  {
    id: "terracotta",
    naam: "Terracotta",
    pagina: "#F1E4DA",
    kaart: "#FBF4EE",
    kop: "#5A3527",
    tekst: "#6E4A3C",
    accent: "#B2603F",
    label: "#B2603F",
    knopTekst: "#FFFFFF",
  },
  {
    id: "poederroze",
    naam: "Poederroze",
    pagina: "#F4E9E7",
    kaart: "#FFFAF8",
    kop: "#553E40",
    tekst: "#6A5456",
    accent: "#BE8A89",
    label: "#BE8A89",
    knopTekst: "#FFFFFF",
  },
  {
    // Bij Palm, Ibiza en Grote titel: zacht roze met terracotta
    id: "blush",
    naam: "Blush",
    pagina: "#F6ECE7",
    kaart: "#FBF3EF",
    kop: "#A9644F",
    tekst: "#946455",
    accent: "#C98E78",
    label: "#A9644F",
    knopTekst: "#FFFFFF",
  },
  {
    id: "bordeaux",
    naam: "Bordeaux",
    pagina: "#EFE3E1",
    kaart: "#FFF9F6",
    kop: "#4A1D23",
    tekst: "#5E3A3E",
    accent: "#7A2B34",
    label: "#7A2B34",
    knopTekst: "#FFFFFF",
  },
]

export function kaartPalet(id: unknown): KaartPalet | null {
  return KAART_PALETTEN.find((p) => p.id === id) ?? null
}

/**
 * De stijlconfiguratie voor deze kaart: die van de website, of met de kleuren
 * van het gekozen palet eroverheen.
 */
export function kaartKleuren(sc: SC, kleur: unknown): SC {
  const p = kaartPalet(kleur)
  if (!p) return sc
  return {
    ...sc,
    accent: p.accent,
    labelColor: p.label,
    headingColor: p.kop,
    bodyText: p.donker ? "#E6DED0" : p.tekst,
    navBg: p.kaart,
    navText: p.kop,
    buttonBg: p.accent,
    buttonText: p.knopTekst,
    bodyBg: p.pagina,
    bodyBackground: null,
    cardBg: p.kaart,
    cardText: p.kop,
    goldBorder: false,
    frameBodyText: null,
    outerBg: null,
  }
}
