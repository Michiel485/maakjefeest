// Een ontwerp op een foto: de opening Ontwerp op foto van de homepagina en
// een kaart met een foto als achtergrond (Michiel, 11 oktober 2026). Op een
// foto werkt alleen lichte tekst; de kleuren van de stijl vallen weg tegen een
// donkere foto, dus worden ze lichter.

import type { SC } from "./event-styles"

/** Een kleur richting wit; deel 0 is de kleur zelf, 1 is wit */
export function lichter(hex: string, deel: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return "#F3E6CF"
  const n = parseInt(m[1], 16)
  const kanaal = (v: number) => Math.round(v + (255 - v) * deel).toString(16).padStart(2, "0")
  return `#${kanaal((n >> 16) & 255)}${kanaal((n >> 8) & 255)}${kanaal(n & 255)}`
}

/**
 * De stijl voor een ontwerp op een foto: rekenen met een donkere achtergrond,
 * zodat het ontwerp overal lichte tekst kiest, en een lichte accentkleur.
 * Goud of groen in de stijlkleur viel weg op een donkere foto.
 */
export function stijlOpFoto(sc: SC): SC {
  return {
    ...sc,
    bodyBg: "#2B2622",
    cardBg: "#2B2622",
    headingColor: "#FFFFFF",
    cardText: "#FFFFFF",
    bodyText: "#F4EFE9",
    accent: lichter(sc.accent, 0.62),
    labelColor: lichter(sc.accent, 0.72),
  }
}

/**
 * De waas over een foto achter een kaart: donkerder aan de randen en in het
 * midden een zachte gloed achter de tekst, zoals op de homepagina.
 */
export const FOTO_WAAS =
  "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0) 100%), linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.26) 50%, rgba(0,0,0,0.46) 100%)"
