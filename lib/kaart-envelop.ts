// De envelop van een kaart, automatisch passend bij het ontwerp.
//
// Eerst (25 september 2026) kon je in de bouwer de kleur, een voering en het
// zegel kiezen. Michiel vond dat te veel, en het oogde goedkoop: "less is
// more". Dus weer zoals het was, de envelop in de stijl van de kaart, en
// alleen de nieuwe ontwerpen die daar iets eigens bij hebben krijgen dat
// vanzelf. Geen keuzes in de bouwer.
//
// Op 26 september 2026 vroeg Michiel of de envelop mooier kon. Nog steeds geen
// keuzes, wel echter: papier met een lichte structuur, vouwen met schaduw in
// plaats van lijntjes, en een zegel van was. Daarvoor rekent dit bestand de
// tinten uit die bij de kleuren van de kaart horen.

import type { CardDesign } from "./cards"
import type { SC } from "./event-styles"

export interface EnvelopStijl {
  /** De envelop zelf */
  lichaam: string
  /** Donker papier: dan werken schaduwen niet en krijgen de randen licht */
  donker: boolean
  /** De structuur van het papier, als eerste laag van een CSS-achtergrond */
  papier: string
  /** De buitenrand, zodat de envelop los staat van een achtergrond in dezelfde kleur */
  rand: string
  /** Wat je aan de binnenkant ziet als de klep opengaat; leeg is geen voering */
  voering: string | null
  /** De was: de kleur zelf, een lichtere en een donkerdere tint */
  zegel: string
  zegelLicht: string
  zegelDonker: string
  /** De ingedrukte letters en het lichtrandje eronder */
  zegelLetter: string
  zegelGlans: string
}

function svgUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function rgb(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "")
  const vol = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6)
  if (!/^[0-9a-f]{6}$/i.test(vol)) return null
  return [0, 2, 4].map((i) => parseInt(vol.slice(i, i + 2), 16)) as [number, number, number]
}

/** Twee kleuren mengen; t = 0 is de eerste, t = 1 de tweede */
function meng(a: string, b: string, t: number): string {
  const x = rgb(a)
  const y = rgb(b)
  if (!x || !y) return a
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")
}

/** Hoe licht een kleur oogt, van 0 (zwart) tot 1 (wit) */
function helderheid(hex: string): number {
  const c = rgb(hex)
  if (!c) return 1
  return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255
}

// Fijne vezels in het papier. Op licht papier donkere spikkels, op donker
// papier lichte; zo subtiel dat je het pas ziet als het er niet is.
function papierStructuur(donker: boolean): string {
  const kleur = donker ? "1" : "0"
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${kleur} 0 0 0 0 ${kleur} 0 0 0 0 ${kleur} ${donker ? "0.16" : "0.2"} 0 0 0 -0.05'/></filter><rect width='100%' height='100%' filter='url(#p)'/></svg>`
  return `${svgUrl(svg)} 0 0 / 200px 200px`
}

export function envelopStijl(sc: SC, ontwerp: CardDesign): EnvelopStijl {
  const lichaam = sc.cardBg ?? sc.navBg
  const donker = helderheid(lichaam) < 0.35
  // Minimaal: een zegel in de kleur van de namen, zonder goud of kleur
  const zegel = ontwerp === "minimaal" ? (sc.cardText ?? sc.headingColor) : sc.accent
  const donkereWas = helderheid(zegel) < 0.3

  let voering: string | null = null
  // Art deco: dezelfde waaier als op de kaart, fijn en in de accentkleur, aan
  // de binnenkant van de klep
  if (ontwerp === "deco") {
    const waaier = svgUrl(
      `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='20' viewBox='0 0 36 20'><g fill='none' stroke='${sc.accent}' stroke-opacity='0.55' stroke-width='0.8'><path d='M0 20a18 18 0 0 1 36 0'/><path d='M6 20a12 12 0 0 1 24 0'/><path d='M12 20a6 6 0 0 1 12 0'/></g></svg>`
    )
    voering = `${waaier} 0 0 / 36px 20px, ${lichaam}`
  }

  return {
    lichaam,
    donker,
    papier: papierStructuur(donker),
    rand: donker ? `${sc.accent}55` : "rgba(0,0,0,0.07)",
    voering,
    zegel,
    zegelLicht: meng(zegel, "#ffffff", donkereWas ? 0.22 : 0.3),
    zegelDonker: meng(zegel, "#000000", donkereWas ? 0.35 : 0.28),
    zegelLetter: donkereWas ? meng(zegel, "#ffffff", 0.4) : meng(zegel, "#000000", 0.5),
    zegelGlans: donkereWas ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.38)",
  }
}
