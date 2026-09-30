// Het beginscherm van de trouwwebsite: de kleur van de site met de namen en de
// datum. De kaart laat het zien achter de deuren die opengaan, en de site
// begint ermee als je van de kaart komt. Zo lijkt het één beweging, terwijl
// de kaart en de site op een ander adres staan (Michiel, 30 september 2026).
//
// Beide kanten rekenen het hier uit, met dezelfde stijl en dezelfde namen.
// Anders verspringt het beeld precies op het moment van de overgang.

import { formatDate, getStyleConfig } from "./event-styles"

export interface SiteOpeningData {
  bg: string
  tekst: string
  accent: string
  fontNamen: string
  fontNamenGewicht: string | number
  fontTekst: string
  fontImport: string | null
  namen: string
  datum: string | null
}

/** De namen zoals de site ze voert */
export function siteNamen(e: { frame_names?: string | null; nav_title?: string | null; title?: string | null }): string {
  return (
    e.frame_names?.trim() ||
    e.nav_title?.trim() ||
    (e.title ?? "").replace(/^de bruiloft van\s+/i, "").trim()
  )
}

export function siteOpeningData(
  style: string,
  fonts: { fontFrameNames?: string | null; fontPageTitles?: string | null },
  namen: string,
  datumIso: string | null | undefined
): SiteOpeningData {
  const sc = getStyleConfig(style, fonts)
  return {
    bg: sc.bodyBg,
    tekst: sc.headingColor,
    accent: sc.accent,
    fontNamen: sc.fontFrameNames,
    fontNamenGewicht: sc.fontFrameNamesWeight,
    fontTekst: sc.fontFamily,
    fontImport: sc.fontImport,
    namen,
    datum: datumIso ? formatDate(datumIso) : null,
  }
}

/** Met deze toevoeging aan het adres weet de site dat je van de kaart komt */
export const VAN_KAART = "van=kaart"

export function naarSiteVanKaart(url: string): string {
  return url + (url.includes("?") ? "&" : "?") + VAN_KAART
}
