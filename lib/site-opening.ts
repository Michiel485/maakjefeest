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

/**
 * Het beginscherm voor wie van de kaart komt, zonder React: het moet er staan
 * voordat de site voor het eerst op het scherm komt, en de pagina is gecached,
 * dus de server kan het adres niet lezen. Zoekt het element #sy-van-kaart,
 * zet het aan, haalt de toevoeging uit het adres en laat het scherm rustig
 * verdwijnen. Gebruikt door de klantsite (app/events/[slug]/layout.tsx) en de
 * voorbeeldsite (app/voorbeeld-site).
 */
const [VK_SLEUTEL, VK_WAARDE] = VAN_KAART.split("=")
export const VAN_KAART_SCRIPT = `(function(){try{var u=new URL(location.href);if(u.searchParams.get(${JSON.stringify(VK_SLEUTEL)})!==${JSON.stringify(VK_WAARDE)})return;var el=document.getElementById("sy-van-kaart");if(!el)return;el.style.display="flex";u.searchParams.delete(${JSON.stringify(VK_SLEUTEL)});history.replaceState(history.state,"",u.pathname+u.search+u.hash);var klaar=false;function weg(){if(klaar)return;klaar=true;setTimeout(function(){el.style.opacity="0";setTimeout(function(){el.style.display="none"},800)},350)}if(document.readyState!=="loading")weg();else document.addEventListener("DOMContentLoaded",weg);setTimeout(weg,1500)}catch(e){}})();`

export function naarSiteVanKaart(url: string, gast?: string | null): string {
  // De persoonlijke link gaat mee: dan zegt de site "Hoi Sam" en staat zijn
  // naam al in het formulier (components/site/Begroeting.tsx)
  const extra = gast && /^[0-9a-f-]{36}$/i.test(gast) ? `&gast=${gast}` : ""
  return url + (url.includes("?") ? "&" : "?") + VAN_KAART + extra
}
