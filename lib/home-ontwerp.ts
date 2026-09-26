// De homepagina met een ontwerp, net als een kaart (Michiel, 26 september
// 2026). Onder de headerfoto kies je een kaartontwerp, en dat staat dan vrij
// op de pagina: zonder kaart eromheen.
//
// Alles staat in homepage_settings, dus er is geen nieuwe kolom nodig.

import type { NieuwOntwerp } from "./cards"

/**
 * De ontwerpen die op de homepagina kunnen. Niet Foto en Foto met handschrift:
 * dat zijn een foto met tekst erop, en dat doet de headerfoto met titel al.
 * Niet het eigen ontwerp, en niet de eerste drie ontwerpen: die zijn echt een
 * kaart, met een rand en een tweede lijntje.
 */
export const HOME_ONTWERPEN: NieuwOntwerp[] = [
  "olijf", "pampas", "pampasruit", "terra", "terraruit", "herfst", "herfstruit", "goudblad", "magnolia",
  "minimaal", "datum", "titel", "palm", "ibiza", "deco", "boog",
]

export function isHomeOntwerp(v: unknown): v is NieuwOntwerp {
  return typeof v === "string" && (HOME_ONTWERPEN as string[]).includes(v)
}

// De kaders van vroeger zijn dezelfde tekeningen als deze ontwerpen
const KADER_NAAR_ONTWERP: Record<string, NieuwOntwerp> = {
  "gold-circle": "pampas",
  "gold-diamond": "pampasruit",
  "terra-circle": "terra",
  "terra-diamond": "terraruit",
  "earthy-circle": "herfst",
  "earthy-diamond": "herfstruit",
  "bloem2-breed": "goudblad",
  "olive-square": "olijf",
  "olive-rectangle": "olijf",
  "bloem-rechthoek": "magnolia",
}

/**
 * Welk ontwerp de homepagina toont. Een gekozen ontwerp; anders het ontwerp
 * dat hoort bij het kader van vroeger; anders Olijf, zoals nieuwe sites.
 */
export function homeOntwerp(opties: { ontwerp?: unknown; useFrame?: boolean | null; frameStyle?: string | null }): NieuwOntwerp {
  if (isHomeOntwerp(opties.ontwerp)) return opties.ontwerp
  if (opties.useFrame && opties.frameStyle && KADER_NAAR_ONTWERP[opties.frameStyle]) return KADER_NAAR_ONTWERP[opties.frameStyle]
  return "olijf"
}

/** Hoe breed het ontwerp op de pagina mag worden: liggende tekeningen breder */
export function homeOntwerpMaxBreedte(ontwerp: NieuwOntwerp): number {
  if (ontwerp === "goudblad" || ontwerp === "magnolia") return 760
  if (ontwerp === "olijf") return 560
  return 460
}

export const HOME_KOP_STANDAARD = "Wij gaan trouwen"
